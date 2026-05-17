import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account yet — subscribe to a plan first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${request.nextUrl.origin}/settings`,
  });
  return NextResponse.json({ url: session.url });
}
