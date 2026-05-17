import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client. Throws if the secret key is missing so
 *  routes fail loud instead of silently no-opping.
 *
 *  Uses Stripe's fetch-based HTTP client: the default Node `https` client
 *  intermittently throws StripeConnectionError on Vercel serverless
 *  (socket/agent reuse across frozen lambdas). The global fetch on the
 *  Vercel Node 18+ runtime is the documented fix. Short timeout + retries
 *  keep us comfortably under the 60s Hobby function cap. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // No explicit apiVersion → use the account's default pinned version.
  _stripe = new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    timeout: 20000,
    maxNetworkRetries: 2,
  });
  return _stripe;
}

export const STRIPE_WEBHOOK_SECRET = () => process.env.STRIPE_WEBHOOK_SECRET ?? "";
