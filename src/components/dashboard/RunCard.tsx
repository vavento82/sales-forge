"use client";

import Link from "next/link";
import { ExternalLink, Globe, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";

export interface RunRow {
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

export function RunCard({
  run,
  leadsTotal,
}: {
  run: RunRow;
  leadsTotal: number;
}) {
  const domain = parseDomain(run.website_url);
  const company = run.company_name || domain || run.run_id;
  const toolCount = (run.tool_1_url ? 1 : 0) + (run.tool_2_url ? 1 : 0);
  const isDeployed = run.status === "tools_deployed";
  const isReportReady = run.status === "report_sent";
  const isError = run.status === "error";

  return (
    <Link
      href={`/dashboard/run/${encodeURIComponent(run.run_id)}`}
      className="block bg-bg border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all duration-150"
    >
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

      <div className="flex items-center justify-between mt-2.5">
        {run.is_free !== false && <Badge color="grey">Free</Badge>}
        <span className="text-[12px] text-text-secondary">
          {formatDate(run.submitted_at)}
        </span>
      </div>

      {isReportReady && run.report_url && (
        <div className="mt-4 bg-primary-light/40 border border-primary-light rounded-md px-3 py-2.5 flex items-center justify-between gap-2">
          <span className="text-[13px] text-primary-dark font-medium">
            Report ready — pick 2 ideas
          </span>
          <span className="text-[12px] text-primary">→</span>
        </div>
      )}

      {isDeployed && (run.tool_1_url || run.tool_2_url) && (
        <div className="mt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
            Live tools
          </p>
          <div className="flex flex-wrap gap-2">
            {run.tool_1_url && (
              <ToolChip name={run.tool_1_name || "Tool 1"} url={run.tool_1_url} />
            )}
            {run.tool_2_url && (
              <ToolChip name={run.tool_2_name || "Tool 2"} url={run.tool_2_url} />
            )}
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-[13px] text-text-secondary">
            <Users size={12} className="text-primary" />
            {leadsTotal} lead{leadsTotal === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {isError && (
        <div className="mt-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
          <p className="text-[13px] text-[#991B1B]">Generation failed</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border">
        <span className="text-[13px] text-text-secondary">
          {isDeployed ? `${toolCount} tool${toolCount === 1 ? "" : "s"}` : ""}
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
