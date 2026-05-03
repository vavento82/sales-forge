"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link as LinkIcon, Users } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function ToolUrlBlock({
  name,
  url,
  leadsCount,
}: {
  name: string;
  url: string;
  leadsCount: number;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="bg-bg border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text-primary truncate">
          {name}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-primary font-medium shrink-0">
          <span className="h-2 w-2 rounded-full bg-primary sf-pulse" />
          Live
        </span>
      </div>

      <div className="mt-4 bg-surface border border-border rounded-md px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <LinkIcon size={14} className="text-text-secondary shrink-0" />
          <span className="text-[13px] font-mono truncate">{url}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy URL"
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg transition"
          >
            {copied ? (
              <Check size={16} className="text-success" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open URL"
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg transition"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <p className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
        <Users size={16} className="text-primary" />
        {leadsCount} lead{leadsCount === 1 ? "" : "s"} captured from this tool
      </p>
    </div>
  );
}
