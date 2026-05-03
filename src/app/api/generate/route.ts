import { NextResponse, after, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// after() can keep tasks running past response — give it a 9-min budget for the
// n8n pipeline to complete and update Supabase.
export const maxDuration = 540;

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";

interface GenerateBody {
  website_url?: string;
  tools_count?: number;
  plan?: "free" | "starter" | "pro";
  // tool_preferences kept optional for backwards compatibility with the
  // legacy form-direct flow; the app no longer sends it.
  tool_preferences?: string[];
  // run_id can be passed from the client (which inserts the run row first);
  // if omitted, this route generates one and inserts the row itself.
  run_id?: string;
}

export async function POST(request: NextRequest) {
  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL is not configured" },
      { status: 500 }
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const websiteUrl = (body.website_url || "").trim();
  if (!websiteUrl || !/^https?:\/\/.+\..+/.test(websiteUrl)) {
    return NextResponse.json(
      { error: "Please enter a valid website URL including https://" },
      { status: 400 }
    );
  }

  const toolsCount = Math.max(1, Math.min(8, body.tools_count ?? 1));
  const plan = body.plan ?? "free";
  const submittedAt = new Date().toISOString();

  // If client supplied a run_id, verify they own it. Otherwise insert a fresh row.
  let runId = body.run_id?.toString().trim() || "";
  if (runId) {
    const { data: existing, error: fetchErr } = await supabase
      .from("runs")
      .select("run_id, user_id, status")
      .eq("run_id", runId)
      .maybeSingle();
    if (fetchErr) {
      return NextResponse.json(
        { error: `Could not verify run: ${fetchErr.message}` },
        { status: 500 }
      );
    }
    if (!existing) {
      // Client-supplied run_id but no row yet — insert it.
      const { error: insertError } = await supabase.from("runs").insert({
        run_id: runId,
        user_id: user.id,
        website_url: websiteUrl,
        user_email: user.email ?? "",
        status: "queued",
        submitted_at: submittedAt,
        tools_count_requested: toolsCount,
        is_free: plan === "free",
      });
      if (insertError) {
        return NextResponse.json(
          { error: `Could not create run: ${insertError.message}` },
          { status: 500 }
        );
      }
    } else if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: this run belongs to another user" },
        { status: 403 }
      );
    }
  } else {
    runId = Date.now().toString() + "-" + Math.random().toString(36).slice(2, 11);
    const { error: insertError } = await supabase.from("runs").insert({
      run_id: runId,
      user_id: user.id,
      website_url: websiteUrl,
      user_email: user.email ?? "",
      status: "queued",
      submitted_at: submittedAt,
      tools_count_requested: toolsCount,
      is_free: plan === "free",
    });
    if (insertError) {
      return NextResponse.json(
        { error: `Could not create run: ${insertError.message}` },
        { status: 500 }
      );
    }
  }

  // Optimistic status bump — visible immediately so the polling UI moves off "queued".
  await supabase
    .from("runs")
    .update({ status: "scraping" })
    .eq("run_id", runId)
    .eq("user_id", user.id);

  // Fire the n8n webhook AFTER the response has been sent. The n8n workflow
  // takes 2–4 minutes (responseMode: lastNode) and will UPDATE the runs row
  // with the report URL when it finishes. The form polls Supabase for that.
  const fwdBody = JSON.stringify({
    run_id: runId,
    submitted_at: submittedAt,
    website_url: websiteUrl,
    company_description: "",
    buyer_title: "",
    company_size: "",
    deal_size: "",
    core_problem: "",
    sales_objections: "",
    competitors: "",
    tool_preferences: body.tool_preferences ?? [],
    tools_count_requested: toolsCount,
    plan,
    user_id: user.id,
    user_email: user.email ?? "",
    source: "saasforge-app",
  });

  after(async () => {
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
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
            error_message: `Pipeline returned ${res.status}: ${text.slice(0, 240)}`,
          })
          .eq("run_id", runId)
          .eq("user_id", user.id);
      }
      // Success path: the n8n workflow itself updates status to report_sent /
      // tools_deployed via Supabase HTTP nodes. We don't need to write anything.
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase
        .from("runs")
        .update({ status: "error", error_message: msg })
        .eq("run_id", runId)
        .eq("user_id", user.id);
    }
  });

  return NextResponse.json({ success: true, run_id: runId });
}
