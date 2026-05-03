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

type Step = 1 | 2 | 3;
type RunState = "running" | "report_ready" | "complete" | "error";

const STATUS_MESSAGES = [
  "Scraping the website...",
  "Running Google research...",
  "Building your ICP profile...",
  "Generating tool ideas...",
  "Building the interactive tool...",
  "Deploying to live URL...",
];

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
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
  const [runId, setRunId] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("running");
  const [statusIdx, setStatusIdx] = useState(0);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Status-message cycling on step 3 while pipeline runs
  useEffect(() => {
    if (step !== 3 || runState !== "running") return;
    cycleRef.current = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2500);
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [step, runState]);

  // Poll Supabase for run status changes
  useEffect(() => {
    if (step !== 3 || !runId || runState !== "running") return;
    const supabase = createClient();
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("runs")
        .select(
          "status, error_message, report_url, tool_1_url, tool_2_url"
        )
        .eq("run_id", runId)
        .maybeSingle();
      if (!data) return;
      // The n8n flow has two terminal states for the auto-trigger:
      //   report_sent     → 6-idea report deployed; user picks 2 on the
      //                     report page which kicks WF2.
      //   tools_deployed  → individual tool URLs are live.
      if (data.status === "tools_deployed") {
        setReportUrl(
          data.tool_1_url || data.tool_2_url || data.report_url || null
        );
        setRunState("complete");
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.status === "report_sent") {
        setReportUrl(data.report_url || null);
        setRunState("report_ready");
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (data.status === "error") {
        setErrorMsg(data.error_message || null);
        setRunState("error");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, runId, runState]);

  function handleNext() {
    if (!isValidUrl(url.trim())) {
      setUrlError("Please enter a valid URL including https://");
      return;
    }
    setUrlError(null);
    setStep(2);
  }

  async function handleGenerate() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: url.trim(),
          tools_count: 1,
          plan: "free",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        run_id?: string;
        error?: string;
      };
      if (!res.ok || !payload.run_id) {
        toast.error(payload.error || "Pipeline failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setRunId(payload.run_id);
      setRunState("running");
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
          onBack={() => setStep(1)}
          onEditUrl={() => setStep(1)}
          onGenerate={handleGenerate}
        />
      )}
      {step === 3 && (
        <Step3
          runId={runId}
          runState={runState}
          statusMessage={STATUS_MESSAGES[statusIdx]}
          reportUrl={reportUrl}
          errorMsg={errorMsg}
          onRetry={() => {
            setRunId(null);
            setRunState("running");
            setReportUrl(null);
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
        Generate micro-SaaS tools
      </h1>
      <p className="text-base text-text-secondary leading-relaxed mb-8">
        Enter the website to analyse. We&apos;ll scrape it, research the market, and build a custom tool for their ICP.
      </p>

      <div className="bg-bg border border-border rounded-xl p-5">
        <Input
          label="Website to analyse"
          type="url"
          placeholder="https://thecompany.com"
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
          Enter the URL of the company you want to generate tools for.
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
  onBack,
  onEditUrl,
  onGenerate,
}: {
  url: string;
  submitting: boolean;
  onBack: () => void;
  onEditUrl: () => void;
  onGenerate: () => void;
}) {
  return (
    <div>
      <h1 className="text-[24px] font-semibold text-text-primary mb-6">
        Ready to generate
      </h1>

      <div className="bg-bg border border-border rounded-xl px-5">
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
        <SummaryRow label="Tools to generate" border>
          <span className="text-sm font-semibold text-text-primary">1 tool</span>
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
          We&apos;ll scrape the website, run Google research, generate an ICP profile, and build 1 custom interactive tool — then email you when it&apos;s live.
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
  reportUrl,
  errorMsg,
  onRetry,
}: {
  runId: string | null;
  runState: RunState;
  statusMessage: string | undefined;
  reportUrl: string | null;
  errorMsg: string | null;
  onRetry: () => void;
}) {
  if (runState === "running") {
    return (
      <div className="text-center py-10">
        <Spinner size="lg" className="mx-auto" />
        <h2 className="mt-6 text-xl font-medium text-text-primary">
          Analysing and building...
        </h2>
        <p
          key={statusMessage}
          className="mt-2 text-[15px] text-text-secondary [animation:sf-fade-in_300ms_ease]"
        >
          {statusMessage}
        </p>
        <p className="mt-4 text-[13px] text-text-secondary">
          This takes 3–5 minutes.
        </p>
        <p className="mt-2 text-[13px] text-text-secondary">
          You can close this page — we&apos;ll email you when ready.
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

  if (runState === "report_ready") {
    return (
      <div className="text-center py-10">
        <AnimatedCheckmark />
        <h2 className="mt-6 text-2xl font-semibold text-text-primary">
          Your report is ready
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary leading-[1.7] max-w-[420px] mx-auto">
          We&apos;ve generated 6 micro-SaaS ideas tailored to this ICP. Open the report, pick 2 ideas, and we&apos;ll build them as live tools.
        </p>
        {reportUrl && (
          <a href={reportUrl} target="_blank" rel="noopener noreferrer">
            <Button className="mt-7 w-full max-w-[280px]">
              Open report →
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

  if (runState === "complete") {
    return (
      <div className="text-center py-10">
        <AnimatedCheckmark />
        <h2 className="mt-6 text-2xl font-semibold text-text-primary">
          Your tools are live!
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary leading-[1.7] max-w-[380px] mx-auto">
          Both micro-SaaS tools have been built and deployed. Share the links in your next cold email.
        </p>
        <Link
          href={runId ? `/dashboard/run/${encodeURIComponent(runId)}` : "/dashboard"}
        >
          <Button className="mt-7 w-full max-w-[280px]">View my tools →</Button>
        </Link>
        {reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-sm text-primary hover:text-primary-dark"
          >
            Or open a live URL directly →
          </a>
        )}
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
