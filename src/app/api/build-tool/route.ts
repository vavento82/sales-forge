import { NextResponse, after, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby cap is 60s. n8n build webhook is onReceived (acks <1s),
// so the after() forwarder needs almost no time.
export const maxDuration = 60;

const N8N_BUILD_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL?.replace(/\/saasforge$/, "/saasforge-selection") ??
  "https://n8n.srv1425833.hstgr.cloud/webhook/saasforge-selection";

interface BuildBody {
  run_id?: string;
  selected_idea_id?: number;
}

interface Idea {
  id?: number;
  name?: string;
  tagline?: string;
  type?: string;
  problem_solved?: string;
  what_user_inputs?: string[];
  what_user_gets?: string;
  bridge_to_sale?: string;
  build_complexity?: string;
}

interface RunRow {
  user_id: string | null;
  status: string;
  ideas_json: Idea[] | null;
  icp_json: Record<string, unknown> | null;
  user_email: string | null;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: BuildBody;
  try {
    body = (await request.json()) as BuildBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const runId = body.run_id?.toString().trim();
  const ideaId = Number(body.selected_idea_id);
  if (!runId || !Number.isFinite(ideaId)) {
    return NextResponse.json(
      { error: "run_id and selected_idea_id are required" },
      { status: 400 }
    );
  }

  // Verify ownership + grab ideas + ICP for the n8n payload.
  const { data: row, error: fetchErr } = await supabase
    .from("runs")
    .select("user_id, status, ideas_json, icp_json, user_email")
    .eq("run_id", runId)
    .maybeSingle();
  if (fetchErr || !row) {
    return NextResponse.json(
      { error: fetchErr?.message || "Run not found" },
      { status: 404 }
    );
  }
  const r = row as RunRow;
  if (r.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (r.status !== "ideas_ready" && r.status !== "report_sent") {
    return NextResponse.json(
      {
        error: `This run is in '${r.status}' state — can only build from 'ideas_ready'.`,
      },
      { status: 409 }
    );
  }

  const idea = (r.ideas_json ?? []).find((i) => i.id === ideaId);
  if (!idea) {
    return NextResponse.json(
      { error: `Idea ${ideaId} not found on this run` },
      { status: 404 }
    );
  }

  // Optimistic status bump so the polling UI moves immediately.
  await supabase
    .from("runs")
    .update({ status: "building" })
    .eq("run_id", runId)
    .eq("user_id", user.id);

  const fwdBody = JSON.stringify({
    run_id: runId,
    user_email: r.user_email ?? user.email ?? "",
    selected_idea_1: idea,
    icp: r.icp_json,
    user_id: user.id,
    source: "saasforge-app",
  });

  after(async () => {
    try {
      const res = await fetch(N8N_BUILD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fwdBody,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        await supabase
          .from("runs")
          .update({
            status: "error",
            error_message: `Build webhook returned ${res.status}: ${text.slice(0, 240)}`,
          })
          .eq("run_id", runId)
          .eq("user_id", user.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase
        .from("runs")
        .update({ status: "error", error_message: msg })
        .eq("run_id", runId)
        .eq("user_id", user.id);
    }
  });

  return NextResponse.json({
    success: true,
    run_id: runId,
    selected_idea_id: ideaId,
  });
}
