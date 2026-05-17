"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ManageBillingButton() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const payload = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !payload.url) {
        toast.error(payload.error || "Could not open billing portal.");
        setLoading(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={openPortal} loading={loading}>
      {loading ? "Opening…" : "Manage billing"}
    </Button>
  );
}
