import { createClient } from "@supabase/supabase-js";

/** Service-role Supabase client. Server-only — bypasses RLS. Used by the
 *  Stripe webhook which has no user session/cookies. NEVER import this from
 *  client components. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
