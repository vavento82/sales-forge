import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  BrainCircuit,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ToolUrlBlock } from "@/components/run/ToolUrlBlock";
import { IdeaPicker, type Idea } from "@/components/generate/IdeaPicker";

interface IcpJson {
  company_name?: string;
  website_url?: string;
  industry?: string;
  sub_niche?: string;
  buyer_title?: string;
  buyer_company_size?: string;
  deal_size?: string;
  brand_tone?: string;
  top_3_pain_points?: string[];
  buyer_language?: string[];
}

interface RunDetail {
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
  deployed_at: string | null;
  is_free: boolean | null;
  error_message: string | null;
  ideas_json: unknown;
  icp_json: IcpJson | null;
}

interface LeadRow {
  id: number;
  email: string | null;
  name: string | null;
  company: string | null;
  score: number | null;
  tool_name: string | null;
  captured_at: string | null;
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

const STATUS_TO_MESSAGE: Record<string, string> = {
  queued: "Queued for processing...",
  scraping: "Scraping the website...",
  building: "Building your tool...",
};

function brandToneColor(
  tone: string | undefined
): "blue" | "green" | "amber" | "grey" {
  if (!tone) return "grey";
  const t = tone.toLowerCase();
  if (t.includes("formal")) return "blue";
  if (t.includes("casual") || t.includes("friendly")) return "green";
  if (t.includes("technical") || t.includes("expert")) return "blue";
  if (t.includes("consultative") || t.includes("authoritative")) return "amber";
  return "grey";
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/dashboard/run/${id}`);

  const { data: run } = await supabase
    .from("runs")
    .select(
      "run_id, website_url, status, company_name, industry, buyer_title, report_url, tool_1_url, tool_1_name, tool_2_url, tool_2_name, submitted_at, deployed_at, is_free, error_message, ideas_json, icp_json"
    )
    .eq("run_id", id)
    .maybeSingle();

  if (!run) notFound();
  const r = run as unknown as RunDetail;

  const { data: leads } = await supabase
    .from("leads")
    .select("id, email, name, company, score, tool_name, captured_at")
    .eq("run_id", id)
    .order("captured_at", { ascending: false })
    .limit(50);

  const leadList = (leads as LeadRow[] | null) ?? [];
  const domain = parseDomain(r.website_url);
  const company = r.icp_json?.company_name || r.company_name || domain || r.run_id;
  const isDeployed = r.status === "tools_deployed";
  const isIdeasReady = r.status === "ideas_ready" || r.status === "report_sent";
  const isPending =
    !isDeployed && !isIdeasReady && r.status !== "error";
  const ideas = (Array.isArray(r.ideas_json) ? (r.ideas_json as Idea[]) : []) ?? [];

  const tool1Name = r.tool_1_name || "Tool 1";
  const tool2Name = r.tool_2_name || "Tool 2";

  return (
    <DashboardShell user={user}>
      <div className="p-6 sm:p-10 max-w-[960px] mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition mb-5"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        {/* HEADER CARD */}
        <section className="bg-bg border border-border rounded-xl p-6 flex flex-col md:flex-row gap-4 md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {domain ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                    domain
                  )}&sz=64`}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-md shrink-0"
                />
              ) : (
                <Globe size={28} className="text-text-secondary shrink-0" />
              )}
              <h1 className="text-2xl font-semibold text-text-primary truncate">
                {company}
              </h1>
            </div>

            {r.website_url && (
              <a
                href={r.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark"
              >
                <span className="truncate">{r.website_url}</span>
                <ExternalLink size={12} />
              </a>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={r.status} />
              {r.is_free !== false && <Badge color="grey">Free</Badge>}
              {r.submitted_at && (
                <span className="text-[13px] text-text-secondary">
                  {formatDate(r.submitted_at)}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <Link href="/generate">
              <Button variant="outline" size="sm">
                New generation →
              </Button>
            </Link>
          </div>
        </section>

        {/* ICP CARD */}
        {r.icp_json && (
          <section className="mt-6 bg-bg border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BrainCircuit size={20} className="text-primary" />
              <h2 className="text-base font-semibold text-text-primary">
                ICP Analysis
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              {/* LEFT */}
              <div className="flex flex-col gap-3">
                <Stat label="Industry" value={r.icp_json.industry} />
                <Stat label="Sub-niche" value={r.icp_json.sub_niche} />
                <Stat label="Buyer" value={r.icp_json.buyer_title} />
                <Stat label="Deal size" value={r.icp_json.deal_size} />
                <Stat
                  label="Company size"
                  value={r.icp_json.buyer_company_size}
                />
                {r.icp_json.brand_tone && (
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                      Brand tone
                    </div>
                    <div className="mt-1.5">
                      <Badge color={brandToneColor(r.icp_json.brand_tone)}>
                        {r.icp_json.brand_tone}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div>
                {r.icp_json.top_3_pain_points && (
                  <>
                    <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                      Top pain points
                    </div>
                    <ol className="mt-2 space-y-2">
                      {r.icp_json.top_3_pain_points.map((p, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-primary font-semibold shrink-0">
                            {i + 1}.
                          </span>
                          <span className="text-sm text-text-primary leading-relaxed">
                            {p}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                {r.icp_json.buyer_language && r.icp_json.buyer_language.length > 0 && (
                  <>
                    <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary mt-5">
                      Buyer language
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.icp_json.buyer_language.map((phrase, i) => (
                        <span
                          key={i}
                          className="border border-border rounded-full px-2.5 py-1 text-[13px] text-text-secondary"
                        >
                          “{phrase}”
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TOOLS */}
        <section className="mt-6">
          {isPending && (
            <div className="bg-bg border border-border rounded-xl p-8 text-center">
              <Spinner size="md" className="mx-auto" />
              <p className="mt-4 text-[15px] text-text-secondary">
                {STATUS_TO_MESSAGE[r.status] || `Status: ${r.status}`}
              </p>
              {r.report_url && (
                <a
                  href={r.report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium"
                >
                  View interim report
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {isIdeasReady && (
            <div className="bg-bg border border-border rounded-xl p-6 sm:p-7">
              <IdeaPicker runId={r.run_id} ideas={ideas} />
            </div>
          )}

          {r.status === "error" && (
            <div className="bg-bg border border-border rounded-xl p-8 text-center">
              <XCircle size={36} className="text-error mx-auto" />
              <p className="mt-3 text-[15px] font-medium text-text-primary">
                Generation failed
              </p>
              <p className="mt-1 text-[13px] text-text-secondary max-w-[420px] mx-auto">
                {r.error_message || "Please contact support."}
              </p>
            </div>
          )}

          {isDeployed && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Your live tools
              </h2>
              <div className="space-y-4">
                {r.tool_1_url && (
                  <ToolUrlBlock
                    name={tool1Name}
                    url={r.tool_1_url}
                    leadsCount={
                      leadList.filter((l) => l.tool_name === tool1Name).length
                    }
                  />
                )}
                {r.tool_2_url && (
                  <ToolUrlBlock
                    name={tool2Name}
                    url={r.tool_2_url}
                    leadsCount={
                      leadList.filter((l) => l.tool_name === tool2Name).length
                    }
                  />
                )}
              </div>
            </>
          )}
        </section>

        {/* LEADS */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Captured leads
            </h2>
            <Badge color="grey">{leadList.length} total</Badge>
          </div>

          {leadList.length === 0 ? (
            <div className="bg-bg border border-border rounded-xl p-8 text-center text-sm text-text-secondary">
              No leads yet. Share your tool URLs to start capturing. Each person who completes a tool will appear here.
            </div>
          ) : (
            <div className="bg-bg border border-border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface text-[11px] uppercase tracking-[0.06em] text-text-secondary">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium">Email</th>
                    <th className="text-left px-4 py-2.5 font-medium">Company</th>
                    <th className="text-left px-4 py-2.5 font-medium">Score</th>
                    <th className="text-left px-4 py-2.5 font-medium">Tool</th>
                    <th className="text-left px-4 py-2.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leadList.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t border-border text-text-primary hover:bg-surface/50 transition"
                    >
                      <td className="px-4 py-3">{l.name || "—"}</td>
                      <td className="px-4 py-3">
                        {l.email ? (
                          <a
                            href={`mailto:${l.email}`}
                            className="text-primary hover:underline"
                          >
                            {l.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">{l.company || "—"}</td>
                      <td className="px-4 py-3">
                        <ScoreBadge score={l.score} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        <span className="block max-w-[160px] truncate">
                          {l.tool_name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(l.captured_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary">
        {label}
      </div>
      <div className="mt-1 text-sm text-text-primary leading-relaxed">
        {value || "—"}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-text-secondary">—</span>;
  const color: "green" | "amber" | "red" =
    score >= 80 ? "green" : score >= 60 ? "amber" : "red";
  return <Badge color={color}>{score} / 100</Badge>;
}
