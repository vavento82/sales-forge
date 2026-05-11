"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export interface Idea {
  id: number;
  name: string;
  tagline?: string;
  type?: string;
  problem_solved?: string;
  what_user_inputs?: string[];
  what_user_gets?: string;
  bridge_to_sale?: string;
  build_complexity?: string;
}

const TYPE_LABEL: Record<string, string> = {
  calculator: "ROI Calculator",
  diagnostic: "Diagnostic",
  generator: "Generator",
  quiz: "Quiz",
  simulator: "Simulator",
  game: "Game",
  audit_tool: "Audit",
  testing_tool: "Testing",
  maturity_assessment: "Diagnostic",
  diagnostic_assessment: "Diagnostic",
  interactive_comparison: "Comparison",
};

export function IdeaPicker({
  runId,
  ideas,
  /** Pre-filled CTA — the website URL the user entered at the start.
   *  They can edit it before building if they want a different destination. */
  defaultCtaUrl = "",
  /** When true, after building we navigate to /dashboard/run/[id] (with polling
   *  there). When false, the parent (/generate flow) handles the transition. */
  redirectOnBuild = true,
  onBuildStarted,
}: {
  runId: string;
  ideas: Idea[];
  defaultCtaUrl?: string;
  redirectOnBuild?: boolean;
  onBuildStarted?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ctaUrl, setCtaUrl] = useState(defaultCtaUrl);
  const [ctaError, setCtaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function normalizeCta(raw: string): string {
    const s = raw.trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    return "https://" + s.replace(/^\/+/, "");
  }

  async function handleBuild() {
    if (selectedId == null) return;
    let cta = ctaUrl.trim();
    if (cta) {
      cta = normalizeCta(cta);
      try {
        const u = new URL(cta);
        if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("scheme");
      } catch {
        setCtaError("Enter a valid URL (e.g. example.com/contact)");
        return;
      }
    }
    setCtaError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/build-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: runId,
          selected_idea_id: selectedId,
          cta_url: cta || undefined,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.success) {
        toast.error(payload.error || "Could not start build. Try again.");
        setSubmitting(false);
        return;
      }
      onBuildStarted?.();
      if (redirectOnBuild) {
        router.push(`/dashboard/run/${encodeURIComponent(runId)}`);
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.06em] text-text-secondary">
          <Sparkles size={12} className="text-primary" />
          6 ideas tailored to your ICP
        </div>
        <h2 className="mt-2 text-[24px] font-semibold text-text-primary">
          Pick one to build
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Free plan includes 1 tool. We&apos;ll build and deploy it as a live URL in 2–3 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ideas.map((idea) => {
          const selected = selectedId === idea.id;
          const typeLabel = idea.type
            ? TYPE_LABEL[idea.type] || idea.type
            : null;
          return (
            <button
              key={idea.id}
              type="button"
              onClick={() => setSelectedId(idea.id)}
              className={cn(
                "relative text-left rounded-xl p-5 border transition-all duration-150 outline-none",
                selected
                  ? "border-2 border-primary bg-primary-light p-[19px]"
                  : "border border-border bg-bg hover:border-primary hover:shadow-sm"
              )}
            >
              {selected && (
                <CheckCircle2
                  size={20}
                  className="absolute top-3.5 right-3.5 text-primary fill-primary [&>path]:stroke-white"
                />
              )}
              <div className="flex items-start justify-between gap-3 pr-7">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Idea {idea.id}
                  </div>
                  <h3 className="mt-1 text-[16px] font-semibold text-text-primary leading-snug">
                    {idea.name}
                  </h3>
                </div>
              </div>
              {typeLabel && (
                <div className="mt-2">
                  <Badge color="grey">{typeLabel}</Badge>
                </div>
              )}
              {idea.tagline && (
                <p className="mt-2.5 text-[13px] text-text-secondary leading-relaxed italic">
                  {idea.tagline}
                </p>
              )}
              {idea.problem_solved && (
                <div className="mt-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                    Problem
                  </div>
                  <p className="mt-1 text-[13px] text-text-primary leading-relaxed line-clamp-3">
                    {idea.problem_solved}
                  </p>
                </div>
              )}
              {idea.what_user_gets && (
                <div className="mt-3 border-l-2 border-primary pl-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-secondary">
                    What the user gets
                  </div>
                  <p className="mt-1 text-[13px] text-text-primary leading-relaxed line-clamp-3">
                    {idea.what_user_gets}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-7 bg-bg border border-border rounded-xl p-5">
        <Input
          label="Where should the result CTA link to?"
          type="text"
          inputMode="url"
          placeholder={defaultCtaUrl || "example.com/contact"}
          value={ctaUrl}
          onChange={(e) => {
            setCtaUrl(e.target.value);
            if (ctaError) setCtaError(null);
          }}
          error={ctaError}
        />
        <p className="mt-1.5 text-[13px] text-text-secondary">
          The button at the end of the tool sends visitors here. Defaults to the
          website you entered — change it to a booking link, contact page, etc.
        </p>
      </div>

      <div className="sticky bottom-0 -mx-1 mt-5 bg-bg/95 backdrop-blur-sm py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-secondary">
          {selectedId != null
            ? `Idea ${selectedId} selected`
            : "Choose 1 idea above to enable Build"}
        </p>
        <Button
          onClick={handleBuild}
          disabled={selectedId == null}
          loading={submitting}
        >
          {submitting ? "Starting build..." : "Build this tool →"}
        </Button>
      </div>
    </div>
  );
}
