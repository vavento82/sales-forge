"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Lightbulb,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { IdeaPicker, type Idea } from "@/components/generate/IdeaPicker";

type Step = 1 | 2 | 3;
type RunState =
  | "running_ideas"
  | "ideas_ready"
  | "building"
  | "complete"
  | "error";

const IDEAS_STATUS_MESSAGES = [
  "Scraping the website...",
  "Running Google research...",
  "Building your ICP profile...",
  "Generating 6 tool ideas...",
];

const BUILD_STATUS_MESSAGES = [
  "Building the interactive tool...",
  "Generating the HTML and lead-capture flow...",
  "Deploying to a live URL...",
];

// Prepend https:// when the user types just a domain so we can use the
// standard URL parser. Doesn't touch existing http(s) inputs.
function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return "https://" + s.replace(/^\/+/, "");
}

// Accepts domains with or without scheme / www, as long as there's at least
// one dot in the hostname and a recognisable TLD. We don't try to be a strict
// validator — Stage 1 of the pipeline (the scrape) will surface real failures.
function isValidUrl(url: string) {
  try {
    const u = new URL(normalizeUrl(url));
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return /\.[a-z]{2,}$/i.test(u.hostname);
  } catch {
    return false;
  }
}

export function GenerateFlow() {
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [buyerTitle, setBuyerTitle] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [questionErrors, setQuestionErrors] = useState<{
    buyer_title?: string;
    company_description?: string;
  }>({});
  const [runId, setRunId] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("running_ideas");
  const [statusIdx, setStatusIdx] = useState(0);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [toolUrl, setToolUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profileCta, setProfileCta] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load the user's saved default CTA once on mount so the picker can pre-fill
  // with it (overrides the entered website URL when set).
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users_profile")
        .select("default_cta_url")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.default_cta_url) setProfileCta(profile.default_cta_url);
    })();
  }, []);

  const isPolling = runState === "running_ideas" || runState === "building";
  const cycleMessages =
    runState === "building" ? BUILD_STATUS_MESSAGES : IDEAS_STATUS_MESSAGES;

  // Status-message cycling on step 3 while pipeline runs
  useEffect(() => {
    if (step !== 3 || !isPolling) return;
    setStatusIdx(0);
    cycleRef.current = setInterval(() => {
      setStatusIdx((i) => (i + 1) % cycleMessages.length);
    }, 2500);
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [step, isPolling, cycleMessages.length]);

  // Poll Supabase for run status changes
  useEffect(() => {
    if (step !== 3 || !runId || !isPolling) return;
    const supabase = createClient();
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("runs")
        .select(
          "status, error_message, ideas_json, tool_1_url, tool_2_url, report_url"
        )
        .eq("run_id", runId)
        .maybeSingle();
      if (!data) return;
      if (data.status === "tools_deployed") {
        setToolUrl(data.tool_1_url || data.tool_2_url || null);
        setRunState("complete");
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (
        runState === "running_ideas" &&
        (data.status === "ideas_ready" || data.status === "report_sent")
      ) {
        setIdeas((data.ideas_json as Idea[] | null) ?? []);
        setRunState("ideas_ready");
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.status === "error") {
        setErrorMsg(data.error_message || null);
        setRunState("error");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 6000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, runId, runState, isPolling]);

  function handleNext() {
    if (!isValidUrl(url.trim())) {
      setUrlError("Enter a valid website (e.g. example.com)");
      return;
    }
    setUrlError(null);
    setStep(2);
  }

  async function handleGenerate() {
    // Validate the 3 questions before firing
    const errs: typeof questionErrors = {};
    if (!buyerTitle.trim() || buyerTitle.trim().length < 3) {
      errs.buyer_title = "Tell us who your ideal customer is";
    }
    if (!companyDescription.trim() || companyDescription.trim().length < 5) {
      errs.company_description = "Tell us what you help them with";
    }
    setQuestionErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: normalizeUrl(url),
          tools_count: 1,
          plan: "free",
          buyer_title: buyerTitle.trim(),
          company_description: companyDescription.trim(),
          competitors: competitors.trim(),
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        run_id?: string;
        error?: string;
        upgrade_required?: boolean;
      };
      if (res.status === 402 || payload.upgrade_required) {
        toast.error(
          payload.error ||
            "You've used your free generation. Upgrade to a paid plan to generate more."
        );
        setSubmitting(false);
        setTimeout(() => {
          window.location.href = "/pricing";
        }, 1500);
        return;
      }
      if (!res.ok || !payload.run_id) {
        toast.error(payload.error || "Pipeline failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setRunId(payload.run_id);
      setRunState("running_ideas");
      setStatusIdx(0);
      setStep(3);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[640px] mx-auto px-1">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition mb-2"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <StepIndicator step={step} className="mb-8" />

      {step === 1 && (
        <Step1
          url={url}
          setUrl={(v) => {
            setUrl(v);
            if (urlError) setUrlError(null);
          }}
          urlError={urlError}
          onNext={handleNext}
        />
      )}
      {step === 2 && (
        <Step2
          url={url}
          submitting={submitting}
          buyerTitle={buyerTitle}
          companyDescription={companyDescription}
          competitors={competitors}
          questionErrors={questionErrors}
          setBuyerTitle={(v) => {
            setBuyerTitle(v);
            if (questionErrors.buyer_title)
              setQuestionErrors({ ...questionErrors, buyer_title: undefined });
          }}
          setCompanyDescription={(v) => {
            setCompanyDescription(v);
            if (questionErrors.company_description)
              setQuestionErrors({
                ...questionErrors,
                company_description: undefined,
              });
          }}
          setCompetitors={setCompetitors}
          onBack={() => setStep(1)}
          onEditUrl={() => setStep(1)}
          onGenerate={handleGenerate}
        />
      )}
      {step === 3 && (
        <Step3
          runId={runId}
          runState={runState}
          statusMessage={cycleMessages[statusIdx]}
          ideas={ideas}
          toolUrl={toolUrl}
          errorMsg={errorMsg}
          defaultCtaUrl={profileCta || url}
          onBuildStarted={() => {
            setRunState("building");
            setStatusIdx(0);
          }}
          onRetry={() => {
            setRunId(null);
            setRunState("running_ideas");
            setIdeas(null);
            setToolUrl(null);
            setErrorMsg(null);
            setStep(1);
          }}
        />
      )}
    </div>
  );
}

function StepIndicator({
  step,
  className,
}: {
  step: Step;
  className?: string;
}) {
  const items = [1, 2, 3] as const;
  return (
    <div className={cn("flex items-center", className)}>
      {items.map((n, i) => {
        const complete = step > n;
        const current = step === n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0",
                complete && "bg-primary text-white",
                current && "bg-primary text-white",
                !complete && !current && "bg-surface text-text-secondary border border-border"
              )}
            >
              {complete ? <Check size={14} strokeWidth={3} /> : n}
            </div>
            {i < items.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  step > n ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1({
  url,
  setUrl,
  urlError,
  onNext,
}: {
  url: string;
  setUrl: (v: string) => void;
  urlError: string | null;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-[28px] font-semibold text-text-primary mb-2">
        Generate a micro-SaaS tool
      </h1>
      <p className="text-base text-text-secondary leading-relaxed mb-8">
        Enter the website to analyse. We&apos;ll scrape it, research the market, then give you 6 ideas to choose from.
      </p>

      <div className="bg-bg border border-border rounded-xl p-5">
        <Input
          label="Website to analyse"
          type="text"
          inputMode="url"
          placeholder="example.com"
          autoComplete="url"
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onNext();
          }}
          error={urlError}
        />
        <p className="mt-1.5 text-[13px] text-text-secondary">
          Domain only is fine (e.g. <code>example.com</code> or{" "}
          <code>www.example.com</code>) — we&apos;ll add <code>https://</code> for you.
        </p>

        <div className="mt-7">
          <div className="text-sm font-medium text-text-primary mb-2">Plan</div>
          <div className="flex items-center gap-3 border-2 border-primary bg-primary-light rounded-lg p-4">
            <CheckCircle2 size={20} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-text-primary">
                1 tool generated
              </div>
              <div className="text-[13px] text-text-secondary mt-0.5">
                Free — no payment needed
              </div>
            </div>
            <Badge color="green">FREE</Badge>
          </div>
          <p className="mt-2.5 text-[13px] text-text-secondary">
            More tools (3, 6, 8) available with paid plans —{" "}
            <Link href="/pricing" className="text-primary font-medium hover:text-primary-dark">
              See pricing →
            </Link>
          </p>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValidUrl(url.trim())}
        className="w-full mt-7"
      >
        Continue →
      </Button>
    </div>
  );
}

function Step2({
  url,
  submitting,
  buyerTitle,
  companyDescription,
  competitors,
  questionErrors,
  setBuyerTitle,
  setCompanyDescription,
  setCompetitors,
  onBack,
  onEditUrl,
  onGenerate,
}: {
  url: string;
  submitting: boolean;
  buyerTitle: string;
  companyDescription: string;
  competitors: string;
  questionErrors: { buyer_title?: string; company_description?: string };
  setBuyerTitle: (v: string) => void;
  setCompanyDescription: (v: string) => void;
  setCompetitors: (v: string) => void;
  onBack: () => void;
  onEditUrl: () => void;
  onGenerate: () => void;
}) {
  return (
    <div>
      <h1 className="text-[24px] font-semibold text-text-primary mb-1">
        While we analyse your website
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        3 quick questions (60 seconds) — these help us generate accurate ideas
        even if your site blocks scrapers.
      </p>

      <div className="bg-bg border border-border rounded-xl p-5 flex flex-col gap-5">
        <Input
          label="Who is your ideal customer?"
          required
          placeholder="e.g. HR directors at mid-market companies"
          value={buyerTitle}
          onChange={(e) => setBuyerTitle(e.target.value)}
          error={questionErrors.buyer_title}
        />
        <Input
          label="What's the main thing you help them with?"
          required
          placeholder="e.g. We help them reduce staff turnover"
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
          error={questionErrors.company_description}
        />
        <Input
          label="Who are your closest competitors?"
          placeholder="e.g. Competitor A, Competitor B (optional)"
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
        />
      </div>

      <div className="mt-5 bg-bg border border-border rounded-xl px-5">
        <SummaryRow label="Website">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary truncate max-w-[220px]">
              {url}
            </span>
            <button
              type="button"
              onClick={onEditUrl}
              className="text-sm text-primary hover:text-primary-dark"
            >
              Edit
            </button>
          </div>
        </SummaryRow>
        <SummaryRow label="Ideas to generate" border>
          <span className="text-sm font-semibold text-text-primary">6 ideas → pick 1</span>
        </SummaryRow>
        <SummaryRow label="Cost" border>
          <span className="text-sm font-semibold text-primary">Free</span>
        </SummaryRow>
        <SummaryRow label="Estimated time" border>
          <span className="text-sm font-semibold text-text-primary">3–5 minutes</span>
        </SummaryRow>
      </div>

      <div className="mt-5 flex items-start gap-2.5 bg-primary-light rounded-md px-4 py-3.5">
        <Lightbulb size={18} className="text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-primary-dark leading-relaxed">
          We&apos;ll scrape the website, run Google research, generate an ICP profile, and propose 6 micro-SaaS ideas. You pick one and we build it as a live URL.
        </p>
      </div>

      <Button onClick={onGenerate} loading={submitting} className="w-full mt-6">
        {submitting ? "Starting..." : "Analyse and generate →"}
      </Button>
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={submitting}
        className="w-full mt-2"
      >
        ← Back
      </Button>
    </div>
  );
}

function SummaryRow({
  label,
  children,
  border,
}: {
  label: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-3",
        border && "border-t border-border"
      )}
    >
      <span className="text-sm text-text-secondary">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Step3({
  runId,
  runState,
  statusMessage,
  ideas,
  toolUrl,
  errorMsg,
  defaultCtaUrl,
  onBuildStarted,
  onRetry,
}: {
  runId: string | null;
  runState: RunState;
  statusMessage: string | undefined;
  ideas: Idea[] | null;
  toolUrl: string | null;
  errorMsg: string | null;
  defaultCtaUrl: string;
  onBuildStarted: () => void;
  onRetry: () => void;
}) {
  if (runState === "running_ideas") {
    return (
      <div className="text-center py-10">
        <Spinner size="lg" className="mx-auto" />
        <h2 className="mt-6 text-xl font-medium text-text-primary">
          Analysing the website...
        </h2>
        <p
          key={statusMessage}
          className="mt-2 text-[15px] text-text-secondary [animation:sf-fade-in_300ms_ease]"
        >
          {statusMessage}
        </p>
        <p className="mt-4 text-[13px] text-text-secondary">
          We&apos;ll have 6 ideas in 2–3 minutes.
        </p>
        <p className="mt-2 text-[13px] text-text-secondary">
          You can leave this page open — it&apos;ll update automatically.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-5 text-sm text-primary hover:text-primary-dark font-medium"
        >
          Go to dashboard →
        </Link>
      </div>
    );
  }

  if (runState === "ideas_ready" && runId) {
    return (
      <IdeaPicker
        runId={runId}
        ideas={ideas ?? []}
        defaultCtaUrl={defaultCtaUrl}
        redirectOnBuild={false}
        onBuildStarted={onBuildStarted}
      />
    );
  }

  if (runState === "building") {
    return (
      <div className="text-center py-10">
        <Spinner size="lg" className="mx-auto" />
        <h2 className="mt-6 text-xl font-medium text-text-primary">
          Building your tool...
        </h2>
        <p
          key={statusMessage}
          className="mt-2 text-[15px] text-text-secondary [animation:sf-fade-in_300ms_ease]"
        >
          {statusMessage}
        </p>
        <p className="mt-4 text-[13px] text-text-secondary">
          This takes about 2 minutes.
        </p>
        <Link
          href={runId ? `/dashboard/run/${encodeURIComponent(runId)}` : "/dashboard"}
          className="inline-block mt-5 text-sm text-primary hover:text-primary-dark font-medium"
        >
          View on dashboard →
        </Link>
      </div>
    );
  }

  if (runState === "complete") {
    return (
      <div className="text-center py-10">
        <AnimatedCheckmark />
        <h2 className="mt-6 text-2xl font-semibold text-text-primary">
          Your tool is live!
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary leading-[1.7] max-w-[380px] mx-auto">
          Your custom micro-SaaS tool has been built and deployed. Share the link in your next cold email.
        </p>
        {toolUrl && (
          <a href={toolUrl} target="_blank" rel="noopener noreferrer">
            <Button className="mt-7 w-full max-w-[280px]">
              Open your tool →
            </Button>
          </a>
        )}
        <Link
          href={runId ? `/dashboard/run/${encodeURIComponent(runId)}` : "/dashboard"}
          className="block mt-3 text-sm text-primary hover:text-primary-dark"
        >
          Or view this run on your dashboard →
        </Link>
      </div>
    );
  }

  // error
  return (
    <div className="text-center py-10">
      <XCircle size={40} className="text-error mx-auto" />
      <h2 className="mt-4 text-xl font-semibold text-text-primary">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-text-secondary max-w-[420px] mx-auto leading-relaxed">
        {errorMsg || "We hit an issue generating your tool. Please try again."}
      </p>
      <Button variant="outline" onClick={onRetry} className="mt-5">
        Try again
      </Button>
    </div>
  );
}

function AnimatedCheckmark() {
  return (
    <svg
      viewBox="0 0 72 72"
      width={72}
      height={72}
      className="mx-auto"
      aria-hidden="true"
    >
      <circle
        cx={36}
        cy={36}
        r={32}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={3}
        style={{
          strokeDasharray: 201,
          strokeDashoffset: 201,
          animation: "drawCircle 500ms ease forwards",
        }}
      />
      <polyline
        points="20,36 30,46 52,26"
        fill="none"
        stroke="var(--primary)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 50,
          strokeDashoffset: 50,
          animation: "drawCheck 300ms ease 500ms forwards",
        }}
      />
      <style>{`
        @keyframes drawCircle { to { stroke-dashoffset: 0 } }
        @keyframes drawCheck { to { stroke-dashoffset: 0 } }
      `}</style>
    </svg>
  );
}
