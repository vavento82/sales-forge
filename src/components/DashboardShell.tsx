import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, Settings, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "./ui/Avatar";
import { LogoutButton } from "./auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { TIER_BY_ID, type PricingTierId } from "@/lib/pricing/tiers";

/** Effective plan for the badge — a paid plan only counts while the Stripe
 *  subscription is active/trialing (matches getQuota, minus the runs-count
 *  query the badge doesn't need). */
async function effectivePlan(userId: string): Promise<PricingTierId> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users_profile")
      .select("plan, subscription_status")
      .eq("id", userId)
      .maybeSingle();
    const plan = (data?.plan as PricingTierId) ?? "free";
    const status = data?.subscription_status as string | undefined;
    const paidActive =
      (plan === "starter" || plan === "pro") &&
      (status === "active" || status === "trialing");
    return paidActive ? plan : "free";
  } catch {
    return "free";
  }
}

export async function DashboardShell({
  user,
  children,
}: {
  user: {
    id?: string;
    email?: string | null;
    user_metadata?: { full_name?: string; avatar_url?: string } | null;
  };
  children: React.ReactNode;
}) {
  const plan = user.id ? await effectivePlan(user.id) : "free";
  const tier = TIER_BY_ID[plan];
  const isPaid = plan === "starter" || plan === "pro";

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-border bg-bg sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard" icon={<LayoutDashboard size={16} />}>
            Dashboard
          </NavLink>
          <NavLink
            href="/generate"
            icon={<PlusCircle size={16} className="text-primary" />}
            accent
          >
            New generation
          </NavLink>
          <NavLink href="/settings" icon={<Settings size={16} />}>
            Settings
          </NavLink>
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          <Link
            href={isPaid ? "/settings" : "/pricing"}
            className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 hover:bg-surface transition group"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full px-2 py-0.5 ${
                  isPaid
                    ? "bg-primary-light text-primary-dark"
                    : "bg-surface text-text-secondary border border-border"
                }`}
              >
                {tier.name}
              </span>
              {isPaid && (
                <span className="text-[11px] text-text-secondary truncate">
                  {tier.priceLabel}
                  {tier.unit.startsWith("/") ? tier.unit : ""}
                </span>
              )}
            </span>
            <span className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition shrink-0">
              {isPaid ? "Manage" : "Upgrade"}
            </span>
          </Link>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar
              size="sm"
              email={user.email}
              name={user.user_metadata?.full_name}
              src={user.user_metadata?.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text-primary truncate">
                {user.user_metadata?.full_name || user.email}
              </div>
              <div className="text-[11px] text-text-secondary truncate">
                {user.email}
              </div>
            </div>
            <LogoutButton>
              <LogOut size={16} className="text-text-secondary" />
            </LogoutButton>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition ${
        accent
          ? "text-primary hover:bg-primary-light"
          : "text-text-secondary hover:bg-surface hover:text-text-primary"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
