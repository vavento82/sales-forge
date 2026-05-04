import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_PLAN_RUN_LIMIT = 1;

/**
 * Count how many free runs this user has used.
 * Errored runs don't count — users can retry a failed generation.
 */
export async function countFreeRunsUsed(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("runs")
    .select("run_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_free", true)
    .neq("status", "error");
  return count ?? 0;
}

export async function isAtFreeLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const used = await countFreeRunsUsed(supabase, userId);
  return used >= FREE_PLAN_RUN_LIMIT;
}
