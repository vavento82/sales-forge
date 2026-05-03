import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SignupForm } from "@/components/auth/SignupForm";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
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
            Create your account
          </h1>
          <p className="text-sm text-text-secondary text-center mt-1.5">
            Free forever. No credit card needed.
          </p>
          <div className="mt-6">
            <SignupForm redirectTo={sp.redirect} />
          </div>
        </div>
        <p className="text-center text-sm text-text-secondary mt-5">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary-dark font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
