import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings as SettingsIcon } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/settings");

  return (
    <DashboardShell user={user}>
      <div className="p-6 sm:p-10 max-w-[1000px] mx-auto">
        <h1 className="text-[28px] font-semibold text-text-primary mb-2">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mb-10">
          Account settings will live here.
        </p>
        <EmptyState
          icon={<SettingsIcon />}
          title="Coming soon"
          description="Profile, API keys, billing and notification settings will appear here in the next iteration."
        />
      </div>
    </DashboardShell>
  );
}
