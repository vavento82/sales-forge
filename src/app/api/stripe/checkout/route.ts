import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { TIER_BY_ID, type PricingTierId } from "@/lib/pricing/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { plan?: PricingTierId };
  try {
    body = (await request.json()) as { plan?: PricingTierId };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan;
  if (plan !== "starter" && plan !== "pro") {
    return NextResponse.json(
      { error: "plan must be 'starter' or 'pro'" },
      { status: 400 }
    );
  }
  const tier = TIER_BY_ID[plan];
  if (!tier.stripePriceId) {
    return NextResponse.json({ error: "Tier not purchasable" }, { status: 400 });
  }

  // Surface the real failure to the client/logs instead of an opaque 500
  // (missing STRIPE_SECRET_KEY, Stripe API error, etc.).
  try {
    const stripe = getStripe();

    // Reuse the user's Stripe customer if we've seen them before.
    const { data: profile } = await supabase
      .from("users_profile")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      // Persist immediately so a retried checkout doesn't orphan customers.
      await supabase
        .from("users_profile")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: tier.stripePriceId, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { supabase_user_id: user.id, plan } },
      metadata: { supabase_user_id: user.id, plan },
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stripe/checkout] failed:", msg);
    return NextResponse.json(
      { error: `Checkout failed: ${msg}` },
      { status: 500 }
    );
  }
}
