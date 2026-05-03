import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Sparkles,
  ExternalLink,
  Hammer,
  Users,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

interface RunRow {
  run_id: string;
  website_url: string | null;
  status: string;
  company_name: string | null;
  industry: string | null;
  buyer_title: string | null;
  report_url: string | null;
  tool_1_url: string | null;
  tool_1_name: string | null;
  tool_2_url: string | null;
  tool_2_name: string | null;
  submitted_at: string | null;
  is_free: boolean | null;
  error_message: string | null;
  ideas_json: { name?: string; id?: number }[] | null;
}

function parseDomain(url: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: runs } = await supabase
    .from("runs")
    .select(
      "run_id, website_url, status, company_name, industry, buyer_title, report_url, tool_1_url, tool_1_name, tool_2_url, tool_2_name, submitted_at, is_free, error_message, ideas_json"
    )
    .order("submitted_at", { ascending: false })
    .limit(50);

  const { data: profile } = await supabase
    .from("users_profile")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Lead count per run (cheap join — leads are user-scoped via RLS).
  const { data: leadRows } = await supabase
    .from("leads")
    .select("run_id, tool_name");

  const leadCountByRun = new Map<string, number>();
  const leadCountByRunTool = new Map<string, number>(); // key: `${run_id}::${tool_name}`
  (leadRows ?? []).forEach((l) => {
    if (!l.run_id) return;
    leadCountByRun.set(l.run_id, (leadCountByRun.get(l.run_id) ?? 0) + 1);
    if (l.tool_name) {
      const k = `${l.run_id}::${l.tool_name}`;
      leadCountByRunTool.set(k, (leadCountByRunTool.get(k) ?? 0) + 1);
    }
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
          <Link href="/generate">
            <Button size="sm">
              <Plus size={16} /> New generation
            </Button>
          </Link>
        </header>

        {/* STATS ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
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

        {/* RUNS SECTION */}
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

        {/* UPGRADE BANNER */}
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

function RunCard({ run, leadsTotal }: { run: RunRow; leadsTotal: number }) {
  const domain = parseDomain(run.website_url);
  const company = run.company_name || domain || run.run_id;
  const toolCount =
    (run.tool_1_url ? 1 : 0) + (run.tool_2_url ? 1 : 0);
  const isDeployed = run.status === "tools_deployed";
  const isError = run.status === "error";

  return (
    <Link
      href={`/dashboard/run/${encodeURIComponent(run.run_id)}`}
      className="block bg-bg border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all duration-150"
    >
      {/* TOP ROW */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {domain ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                domain
              )}&sz=32`}
              alt=""
              width={20}
              height={20}
              className="rounded-sm shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Globe size={16} className="text-text-secondary shrink-0" />
          )}
          <span className="text-[15px] font-semibold text-text-primary truncate">
            {company}
          </span>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {/* WEBSITE URL ROW */}
      {run.website_url && (
        <a
          href={run.website_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary truncate max-w-full"
        >
          <span className="truncate">{domain || run.website_url}</span>
          <ExternalLink size={10} className="shrink-0" />
        </a>
      )}

      {/* META ROW */}
      <div className="flex items-center justify-between mt-2.5">
        {run.is_free !== false && <Badge color="grey">Free</Badge>}
        <span className="text-[12px] text-text-secondary">
          {formatDate(run.submitted_at)}
        </span>
      </div>

      {/* LIVE TOOLS BLOCK */}
      {isDeployed && (run.tool_1_url || run.tool_2_url) && (
        <div className="mt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
            Live tools
          </p>
          <div className="flex flex-wrap gap-2">
            {run.tool_1_url && (
              <ToolChip
                name={run.tool_1_name || "Tool 1"}
                url={run.tool_1_url}
              />
            )}
            {run.tool_2_url && (
              <ToolChip
                name={run.tool_2_name || "Tool 2"}
                url={run.tool_2_url}
              />
            )}
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-[13px] text-text-secondary">
            <Users size={12} className="text-primary" />
            {leadsTotal} lead{leadsTotal === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {/* ERROR BLOCK */}
      {isError && (
        <div className="mt-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
          <p className="text-[13px] text-[#991B1B]">Generation failed</p>
        </div>
      )}

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border">
        <span className="text-[13px] text-text-secondary">
          {isDeployed
            ? `${toolCount} tool${toolCount === 1 ? "" : "s"}`
            : ""}
        </span>
        <span className="text-[13px] text-primary font-medium">
          View details →
        </span>
      </div>
    </Link>
  );
}

function ToolChip({ name, url }: { name: string; url: string }) {
  const truncated = name.length > 18 ? name.slice(0, 17) + "…" : name;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 bg-primary-light text-primary rounded-full px-2.5 py-1 text-[11px] font-medium hover:bg-primary hover:text-white transition"
    >
      <ExternalLink size={10} />
      {truncated}
    </a>
  );
}
