import { NextResponse, after, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getQuota } from "@/lib/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby caps function duration at 60s. n8n now responds in <1s
// (responseMode: onReceived), so 60 is plenty for the after() forward.
export const maxDuration = 60;

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";

interface GenerateBody {
  website_url?: string;
  tools_count?: number;
  plan?: "free" | "starter" | "pro";
  // 3 questions collected on /generate step 2 — used as Serper query
  // fallbacks and ICP grounding when the website scrape fails.
  buyer_title?: string;
  company_description?: string;
  competitors?: string;
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

  // Server-authoritative quota. Plan is read from users_profile (set by the
  // Stripe webhook), NOT from body.plan — the request body is spoofable.
  // Counts non-error runs in the current period (calendar month for free,
  // Stripe billing window for paid).
  const quota = await getQuota(supabase, user.id);
  const plan = quota.plan;
  if (!quota.allowed) {
    const msg =
      plan === "free"
        ? `You've used your ${quota.limit} free run this month. Upgrade for more.`
        : `You've used all ${quota.limit} runs on your ${plan} plan this period.`;
    return NextResponse.json(
      {
        error: msg,
        upgrade_required: true,
        plan,
        used: quota.used,
        limit: quota.limit,
      },
      { status: 402 }
    );
  }

  // Accept scheme-less domains too — prepend https:// if missing so the
  // downstream scraper always gets a fully-qualified URL.
  let websiteUrl = (body.website_url || "").trim();
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    websiteUrl = "https://" + websiteUrl.replace(/^\/+/, "");
  }
  if (!websiteUrl || !/^https?:\/\/[^\s.]+\.[^\s]+/.test(websiteUrl)) {
    return NextResponse.json(
      { error: "Please enter a valid website (e.g. example.com)" },
      { status: 400 }
    );
  }

  const toolsCount = Math.max(1, Math.min(8, body.tools_count ?? 1));
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
    company_description: (body.company_description || "").trim(),
    buyer_title: (body.buyer_title || "").trim(),
    company_size: "",
    deal_size: "",
    core_problem: "",
    sales_objections: "",
    competitors: (body.competitors || "").trim(),
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
