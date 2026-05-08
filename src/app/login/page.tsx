import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(sp.redirect || "/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-surface">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <div className="bg-bg border border-border rounded-2xl p-7 shadow-sm">
          <h1 className="text-2xl font-semibold text-text-primary text-center">
            Welcome back
          </h1>
          <p className="text-sm text-text-secondary text-center mt-1.5">
            Sign in to your SassyForge account
          </p>
          <div className="mt-6">
            <LoginForm initialError={sp.error} redirectTo={sp.redirect} />
          </div>
        </div>
        <p className="text-center text-sm text-text-secondary mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary-dark font-medium"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  );
}
