import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { GenerateFlow } from "@/components/generate/GenerateFlow";
import { Button } from "@/components/ui/Button";
import { getQuota } from "@/lib/quota";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/generate");

  const quota = await getQuota(supabase, user.id);

  return (
    <DashboardShell user={user}>
      <div className="p-6 sm:p-10 max-w-[640px] mx-auto">
        {!quota.allowed ? (
          <LimitReached plan={quota.plan} limit={quota.limit} />
        ) : (
          <GenerateFlow />
        )}
      </div>
    </DashboardShell>
  );
}

function LimitReached({ plan, limit }: { plan: string; limit: number }) {
  const isFree = plan === "free";
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-14 w-14 rounded-full bg-primary-light text-primary flex items-center justify-center">
        <Sparkles size={28} />
      </div>
      <h1 className="mt-6 text-[26px] font-semibold text-text-primary">
        {isFree
          ? "You've used your free run this month"
          : `You've hit your ${plan} plan limit`}
      </h1>
      <p className="mt-3 text-[15px] text-text-secondary leading-relaxed max-w-[440px] mx-auto">
        {isFree
          ? `The free plan includes ${limit} run per month. Upgrade to Starter or Pro for more runs and tools per run.`
          : `You've used all ${limit} runs in your current billing period. They reset at your next renewal — or upgrade for a higher allowance.`}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href={isFree ? "/pricing" : "/settings"}>
          <Button>{isFree ? "See pricing →" : "Manage plan →"}</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">Back to dashboard</Button>
        </Link>
      </div>

      <div className="mt-12 max-w-[440px] mx-auto rounded-xl border border-border bg-surface p-5 text-left">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
          What you can still do
        </p>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary leading-relaxed">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            View your existing run, ideas, and the deployed report
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Pick 2 ideas from your report — those still build for free
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Capture leads from your live tools indefinitely
          </li>
        </ul>
      </div>
    </div>
  );
}
