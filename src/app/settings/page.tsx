import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings as SettingsIcon, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ManageBillingButton } from "@/components/settings/ManageBillingButton";
import { getQuota } from "@/lib/quota";
import { TIER_BY_ID } from "@/lib/pricing/tiers";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/settings");

  const quota = await getQuota(supabase, user.id);
  const tier = TIER_BY_ID[quota.plan];
  const isPaid = quota.plan === "starter" || quota.plan === "pro";

  return (
    <DashboardShell user={user}>
      <div className="p-6 sm:p-10 max-w-[1000px] mx-auto">
        <h1 className="text-[28px] font-semibold text-text-primary mb-2">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Account settings will live here.
        </p>

        {/* BILLING */}
        <section className="bg-bg border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-text-primary">
              Plan &amp; billing
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-text-primary">
                  {tier.name}
                </span>
                <Badge color={isPaid ? "green" : "grey"}>
                  {tier.priceLabel}
                  {tier.unit.startsWith("/") ? tier.unit : ""}
                </Badge>
              </div>
              <p className="mt-1 text-[13px] text-text-secondary">
                {quota.used} / {quota.limit} runs used this period
                {quota.remaining > 0
                  ? ` · ${quota.remaining} remaining`
                  : " · limit reached"}
              </p>
            </div>
            {isPaid ? (
              <ManageBillingButton />
            ) : (
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-md bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-dark transition"
              >
                Upgrade →
              </Link>
            )}
          </div>
        </section>

        <EmptyState
          icon={<SettingsIcon />}
          title="More settings coming soon"
          description="Profile, API keys and notification settings will appear here in the next iteration."
        />
      </div>
    </DashboardShell>
  );
}
