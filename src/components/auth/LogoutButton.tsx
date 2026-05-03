"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  async function handle() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={handle}
      type="button"
      aria-label="Log out"
      className={className ?? "p-1.5 rounded-md hover:bg-surface transition"}
    >
      {children}
    </button>
  );
}
