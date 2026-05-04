import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { GenerateFlow } from "@/components/generate/GenerateFlow";
import { Button } from "@/components/ui/Button";
import { countFreeRunsUsed, FREE_PLAN_RUN_LIMIT } from "@/lib/quota";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/generate");

  const used = await countFreeRunsUsed(supabase, user.id);
  const atLimit = used >= FREE_PLAN_RUN_LIMIT;

  return (
    <DashboardShell user={user}>
      <div className="p-6 sm:p-10 max-w-[640px] mx-auto">
        {atLimit ? <LimitReached /> : <GenerateFlow />}
      </div>
    </DashboardShell>
  );
}

function LimitReached() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-14 w-14 rounded-full bg-primary-light text-primary flex items-center justify-center">
        <Sparkles size={28} />
      </div>
      <h1 className="mt-6 text-[26px] font-semibold text-text-primary">
        You&apos;ve used your free generation
      </h1>
      <p className="mt-3 text-[15px] text-text-secondary leading-relaxed max-w-[440px] mx-auto">
        The free plan includes 1 generation. Paid plans (3, 6, and 8 tools per
        website) are launching soon — sign up for early access.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/pricing">
          <Button>See pricing →</Button>
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
