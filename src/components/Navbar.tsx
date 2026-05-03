import Link from "next/link";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "./ui/Avatar";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1100px] px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md transition"
          >
            Pricing
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md transition"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="ml-1 inline-flex"
                aria-label="Account"
              >
                <Avatar
                  size="sm"
                  email={user.email}
                  name={user.user_metadata?.full_name}
                />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md transition"
              >
                Log in
              </Link>
              <Link href="/signup">
                <Button size="sm">Start free →</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
