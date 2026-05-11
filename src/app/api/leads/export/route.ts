import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mirrors the free-tier cap on the dashboard view: free accounts can export
// up to the 5 most-recent leads per run.
const FREE_LEAD_EXPORT_LIMIT = 5;

interface LeadRow {
  id: number;
  captured_at: string | null;
  name: string | null;
  email: string | null;
  company: string | null;
  score: number | null;
  tool_name: string | null;
  choices: unknown;
  time_to_complete: number | null;
  tool_url: string | null;
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function slugify(s: string | null | undefined): string {
  return (s || "leads")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "leads";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const runId = request.nextUrl.searchParams.get("run_id");
  if (!runId) {
    return NextResponse.json({ error: "run_id required" }, { status: 400 });
  }

  const { data: run, error: runErr } = await supabase
    .from("runs")
    .select("user_id, is_free, company_name")
    .eq("run_id", runId)
    .maybeSingle();
  if (runErr || !run) {
    return NextResponse.json({ error: runErr?.message || "Run not found" }, { status: 404 });
  }
  if (run.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isFree = run.is_free !== false;
  const limit = isFree ? FREE_LEAD_EXPORT_LIMIT : 50000;

  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select(
      "id, captured_at, name, email, company, score, tool_name, choices, time_to_complete, tool_url"
    )
    .eq("run_id", runId)
    .order("captured_at", { ascending: false })
    .limit(limit);
  if (leadsErr) {
    return NextResponse.json({ error: leadsErr.message }, { status: 500 });
  }

  const rows = (leads as LeadRow[] | null) ?? [];
  const headers = [
    "captured_at",
    "name",
    "email",
    "company",
    "score",
    "tool_name",
    "time_to_complete_sec",
    "tool_url",
    "choices_json",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.captured_at),
        csvEscape(r.name),
        csvEscape(r.email),
        csvEscape(r.company),
        r.score ?? "",
        csvEscape(r.tool_name),
        r.time_to_complete ?? "",
        csvEscape(r.tool_url),
        csvEscape(
          typeof r.choices === "string"
            ? r.choices
            : JSON.stringify(r.choices ?? {})
        ),
      ].join(",")
    );
  }

  // Prepend a UTF-8 BOM so Excel auto-detects encoding correctly (otherwise
  // accented characters render as mojibake on Windows).
  const body = "﻿" + lines.join("\n");

  const slug = slugify(run.company_name);
  const filename = `${slug}-leads-${runId.slice(-8)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
