import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";
import { GenerateFlow } from "@/components/generate/GenerateFlow";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/generate");

  return (
    <DashboardShell user={user}>
      <div className="p-6 sm:p-10 max-w-[640px] mx-auto">
        <GenerateFlow />
      </div>
    </DashboardShell>
  );
}
