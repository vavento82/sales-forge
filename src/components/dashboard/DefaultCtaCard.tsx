"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function DefaultCtaCard({ initial }: { initial: string }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const dirty = value.trim() !== saved.trim();

  async function save() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/cta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_cta_url: value }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        default_cta_url?: string;
        error?: string;
      };
      if (!res.ok || !payload.success) {
        toast.error(payload.error || "Could not save CTA URL.");
        return;
      }
      const next = payload.default_cta_url ?? "";
      setValue(next);
      setSaved(next);
      toast.success(next ? "Default CTA saved" : "Default CTA cleared");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-bg border border-border rounded-xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1.5">
        <Link2 size={18} className="text-primary" />
        <h3 className="text-[15px] font-semibold text-text-primary">
          Default CTA URL
        </h3>
      </div>
      <p className="text-[13px] text-text-secondary mb-4">
        The button at the end of every generated tool sends visitors here. You
        can still override this per-tool on the build step.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
        <div className="flex-1">
          <Input
            type="text"
            inputMode="url"
            placeholder="example.com/book"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && dirty) save();
            }}
          />
        </div>
        <Button
          onClick={save}
          disabled={!dirty}
          loading={submitting}
          className="sm:w-auto"
        >
          {submitting ? "Saving..." : dirty ? "Save" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
