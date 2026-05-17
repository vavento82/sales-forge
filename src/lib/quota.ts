import type { SupabaseClient } from "@supabase/supabase-js";
import { runsPerMonthForPlan, type PricingTierId } from "@/lib/pricing/tiers";

/** @deprecated kept for any external callers; use getQuota instead. */
export const FREE_PLAN_RUN_LIMIT = 1;

export interface Quota {
  plan: PricingTierId;
  /** ISO timestamp the current allowance window started. */
  periodStart: string;
  used: number;
  limit: number;
  remaining: number;
  /** true if the user may start another run right now. */
  allowed: boolean;
}

function startOfUtcMonth(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

/**
 * Resolve the user's effective plan. A paid plan only counts while the Stripe
 * subscription is active/trialing — past_due / canceled fall back to free so
 * lapsed payers can't keep generating.
 */
async function resolvePlan(
  supabase: SupabaseClient,
  userId: string
): Promise<{ plan: PricingTierId; periodStart: string }> {
  const { data } = await supabase
    .from("users_profile")
    .select("plan, subscription_status, current_period_start")
    .eq("id", userId)
    .maybeSingle();

  const rawPlan = (data?.plan as PricingTierId) ?? "free";
  const status = data?.subscription_status as string | undefined;
  const paidActive =
    (rawPlan === "starter" || rawPlan === "pro") &&
    (status === "active" || status === "trialing");

  if (paidActive) {
    // Paid → window anchored to the Stripe billing period.
    const ps = data?.current_period_start as string | null | undefined;
    return {
      plan: rawPlan,
      periodStart: ps ?? new Date(Date.now() - 30 * 86400_000).toISOString(),
    };
  }
  // Free (or lapsed) → calendar-month UTC window.
  return { plan: "free", periodStart: startOfUtcMonth() };
}

/** Count non-error runs the user has started since periodStart. */
async function countRunsSince(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string
): Promise<number> {
  const { count } = await supabase
    .from("runs")
    .select("run_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("submitted_at", periodStart)
    .neq("status", "error");
  return count ?? 0;
}

/** Authoritative quota check. Server-side only. */
export async function getQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<Quota> {
  const { plan, periodStart } = await resolvePlan(supabase, userId);
  const limit = runsPerMonthForPlan(plan);
  const used = await countRunsSince(supabase, userId, periodStart);
  return {
    plan,
    periodStart,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    allowed: used < limit,
  };
}

/** @deprecated thin shim over getQuota for legacy call sites. */
export async function countFreeRunsUsed(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  return (await getQuota(supabase, userId)).used;
}

/** @deprecated use getQuota().allowed === false */
export async function isAtFreeLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return !(await getQuota(supabase, userId)).allowed;
}
