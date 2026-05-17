import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForPriceId } from "@/lib/pricing/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Map a subscription object → the columns we persist on users_profile.
function subToProfilePatch(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id ?? "";
  const plan = planForPriceId(priceId);
  const active = sub.status === "active" || sub.status === "trialing";
  // current_period_* lives at the top level on older API versions and on the
  // subscription item on newer ones — read whichever is present.
  const anySub = sub as unknown as Record<string, number | undefined>;
  const anyItem = item as unknown as Record<string, number | undefined>;
  const pStart = anySub.current_period_start ?? anyItem?.current_period_start;
  const pEnd = anySub.current_period_end ?? anyItem?.current_period_end;
  return {
    plan: active && plan ? plan : "free",
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_start: pStart ? new Date(pStart * 1000).toISOString() : null,
    current_period_end: pEnd ? new Date(pEnd * 1000).toISOString() : null,
  };
}

async function applyByCustomer(
  customerId: string,
  patch: Record<string, unknown>,
  fallbackUserId?: string | null
) {
  const admin = createAdminClient();
  // Prefer matching on the customer id we stored at checkout.
  const { data: byCust } = await admin
    .from("users_profile")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  const targetId = byCust?.id ?? fallbackUserId;
  if (!targetId) {
    console.warn(`[stripe webhook] no users_profile for customer ${customerId}`);
    return;
  }
  await admin
    .from("users_profile")
    .update({ ...patch, stripe_customer_id: customerId })
    .eq("id", targetId);
}

export async function POST(request: NextRequest) {
  const secret = STRIPE_WEBHOOK_SECRET();
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });
  }
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // RAW body — must not parse JSON before verifying the HMAC.
  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Signature check failed: ${msg}` }, { status: 400 });
  }

  // Subscription writes must complete BEFORE we 200 Stripe (no after()).
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof s.subscription === "string" ? s.subscription : s.subscription.id
          );
          await applyByCustomer(
            typeof s.customer === "string" ? s.customer : s.customer!.id,
            subToProfilePatch(sub),
            s.client_reference_id || (s.metadata?.supabase_user_id ?? null)
          );
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const patch =
          event.type === "customer.subscription.deleted"
            ? {
                plan: "free",
                subscription_status: "canceled",
                stripe_subscription_id: sub.id,
              }
            : subToProfilePatch(sub);
        await applyByCustomer(
          typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          patch,
          (sub.metadata?.supabase_user_id as string) ?? null
        );
        break;
      }
      default:
        // Unhandled event types are fine — ack so Stripe stops retrying.
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[stripe webhook] handler error on ${event.type}: ${msg}`);
    // 500 → Stripe retries, which is what we want for a transient DB blip.
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
