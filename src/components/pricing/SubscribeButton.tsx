"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { PricingTierId } from "@/lib/pricing/tiers";

export function SubscribeButton({
  plan,
  label,
}: {
  plan: Extract<PricingTierId, "starter" | "pro">;
  label: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        router.push("/login?redirect=/pricing");
        return;
      }
      const payload = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        diagnostic?: string;
      };
      if (!res.ok || !payload.url) {
        const base = payload.error || "Could not start checkout. Try again.";
        toast.error(payload.diagnostic ? `${base} [${payload.diagnostic}]` : base);
        setLoading(false);
        return;
      }
      // Hosted Stripe Checkout.
      window.location.href = payload.url;
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button onClick={subscribe} loading={loading} className="w-full">
      {loading ? "Redirecting…" : label}
    </Button>
  );
}
