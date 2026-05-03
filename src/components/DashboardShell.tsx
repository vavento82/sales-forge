import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, Settings, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "./ui/Avatar";
import { LogoutButton } from "./auth/LogoutButton";

export function DashboardShell({
  user,
  children,
}: {
  user: {
    email?: string | null;
    user_metadata?: { full_name?: string; avatar_url?: string } | null;
  };
  children: React.ReactNode;
}) {
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
        <div className="border-t border-border p-3">
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
