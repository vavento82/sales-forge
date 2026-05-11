import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Sparkles,
  Hammer,
  Users,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RunCard, type RunRow } from "@/components/dashboard/RunCard";
import { DefaultCtaCard } from "@/components/dashboard/DefaultCtaCard";
import { countFreeRunsUsed, FREE_PLAN_RUN_LIMIT } from "@/lib/quota";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: runs } = await supabase
    .from("runs")
    .select(
      "run_id, website_url, status, company_name, industry, buyer_title, report_url, tool_1_url, tool_1_name, tool_2_url, tool_2_name, submitted_at, is_free, error_message"
    )
    .order("submitted_at", { ascending: false })
    .limit(50);

  const { data: profile } = await supabase
    .from("users_profile")
    .select("full_name, default_cta_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: leadRows } = await supabase
    .from("leads")
    .select("run_id");

  const leadCountByRun = new Map<string, number>();
  (leadRows ?? []).forEach((l) => {
    if (!l.run_id) return;
    leadCountByRun.set(l.run_id, (leadCountByRun.get(l.run_id) ?? 0) + 1);
  });

  const list = (runs as RunRow[] | null) ?? [];
  const liveRuns = list.filter((r) => r.status === "tools_deployed");
  const totalTools = list.reduce(
    (acc, r) => acc + (r.tool_1_url ? 1 : 0) + (r.tool_2_url ? 1 : 0),
    0
  );
  const totalLeads = leadRows?.length ?? 0;
  const firstName = (
    profile?.full_name || user.user_metadata?.full_name || user.email || ""
  )
    .toString()
    .trim()
    .split(/\s+/)[0];

  const freeRunsUsed = await countFreeRunsUsed(supabase, user.id);
  const atLimit = freeRunsUsed >= FREE_PLAN_RUN_LIMIT;

  return (
    <DashboardShell user={user}>
      <div className="p-6 sm:p-10 max-w-[1000px] mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] font-semibold text-text-primary">
              Dashboard
            </h1>
            {firstName && (
              <p className="text-sm text-text-secondary mt-0.5">
                Welcome back, {firstName}
              </p>
            )}
          </div>
          {atLimit ? (
            <Link href="/pricing">
              <Button size="sm" variant="outline">
                Upgrade for more →
              </Button>
            </Link>
          ) : (
            <Link href="/generate">
              <Button size="sm">
                <Plus size={16} /> New generation
              </Button>
            </Link>
          )}
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Tools generated"
            value={totalTools}
            sub="total across all runs"
            icon={<Hammer size={20} className="text-text-secondary" />}
          />
          <StatCard
            label="Leads captured"
            value={totalLeads}
            sub="from deployed tools"
            icon={<Users size={20} className="text-primary" />}
          />
          <StatCard
            label="Active tools"
            value={liveRuns.length}
            sub="tools live right now"
            icon={<Globe size={20} className="text-primary" />}
          />
        </section>

        <section className="mb-10">
          <DefaultCtaCard initial={profile?.default_cta_url ?? ""} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Your generations
            </h2>
            <Badge color="grey">
              {list.length} run{list.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={<Sparkles />}
              title="No tools yet"
              description="Generate your first free micro-SaaS tool. We'll scrape the website, analyse the ICP, and build a custom interactive tool in minutes."
              action={
                <Link href="/generate">
                  <Button>Generate your first tool →</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {list.map((r) => (
                <RunCard
                  key={r.run_id}
                  run={r}
                  leadsTotal={leadCountByRun.get(r.run_id) ?? 0}
                />
              ))}
            </div>
          )}
        </section>

        <section
          className="mt-12 rounded-2xl px-8 py-7 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #085041 100%)",
          }}
        >
          <div>
            <p className="text-xl font-semibold">More tools with paid plans</p>
            <p className="text-sm text-white/70 leading-relaxed mt-1.5 max-w-[560px]">
              Generate up to 8 custom tools per website. Paid plans launching soon — sign up to get early access.
            </p>
          </div>
          <Link href="/pricing" className="shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-white text-primary rounded-md px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition">
              See pricing →
            </span>
          </Link>
        </section>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-bg border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2 text-[32px] font-bold text-text-primary leading-none">
        {value}
      </div>
      <div className="mt-1 text-[13px] text-text-secondary">{sub}</div>
    </div>
  );
}
