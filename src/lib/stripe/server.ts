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
/** Non-secret shape report for diagnosing malformed env vars. Never logs the
 *  key itself — only length, prefix, and whether it had stray whitespace/quotes
 *  (the usual cause of a bad Authorization header → StripeConnectionError). */
export function stripeKeyDiagnostic(): string {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (raw === undefined) return "STRIPE_SECRET_KEY: undefined (not set in env)";
  const trimmed = sanitizeKey(raw);
  return [
    `rawLen=${raw.length}`,
    `trimmedLen=${trimmed.length}`,
    `prefix=${trimmed.slice(0, 8)}`,
    `hadOuterWhitespace=${raw !== raw.trim()}`,
    `hadQuotes=${/^["'].*["']$/.test(raw.trim())}`,
    `looksValid=${/^sk_(test|live)_[A-Za-z0-9]+$/.test(trimmed)}`,
  ].join(" ");
}

function sanitizeKey(raw: string): string {
  // Strip surrounding whitespace/newlines and a single layer of wrapping
  // quotes — both are common when pasting into a dashboard env-var field.
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  return k;
}

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const raw = process.env.STRIPE_SECRET_KEY;
  if (!raw) throw new Error("STRIPE_SECRET_KEY is not set");
  const key = sanitizeKey(raw);
  if (!/^sk_(test|live)_/.test(key)) {
    throw new Error(
      `STRIPE_SECRET_KEY is malformed (${stripeKeyDiagnostic()})`
    );
  }
  // No explicit apiVersion → use the account's default pinned version.
  _stripe = new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    timeout: 20000,
    maxNetworkRetries: 2,
  });
  return _stripe;
}

export const STRIPE_WEBHOOK_SECRET = () =>
  (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
