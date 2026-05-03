"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email or password is incorrect";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first";
  if (m.includes("too many requests"))
    return "Too many attempts. Please wait a moment.";
  return message;
}

export function LoginForm({
  initialError,
  redirectTo,
}: {
  initialError?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Surface any error redirected from /auth/callback as a toast on mount
  useEffect(() => {
    if (initialError) toast.error(mapAuthError(initialError));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(mapAuthError(error.message));
      setLoading(false);
      return;
    }
    toast.success("Signed in");
    router.push(redirectTo || "/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setOauthLoading(true);
    const supabase = createClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const next = redirectTo || "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      toast.error(mapAuthError(error.message));
      setOauthLoading(false);
    }
  }

  async function handleForgot() {
    if (!email.trim()) {
      toast.error("Enter your email address first");
      return;
    }
    setResetting(true);
    const supabase = createClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback`,
    });
    setResetting(false);
    if (error) {
      toast.error(mapAuthError(error.message));
      return;
    }
    toast.success("Password reset email sent");
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        loading={oauthLoading}
        onClick={handleGoogle}
        className="w-full"
      >
        <GoogleIcon /> Continue with Google
      </Button>

      <Divider />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldLabel htmlFor="login-email">Email address</FieldLabel>
        <input
          id="login-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="-mt-2 w-full h-13 px-4 rounded-md text-base text-text-primary bg-bg border-[1.5px] border-border outline-none transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
        />

        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <button
            type="button"
            onClick={handleForgot}
            disabled={resetting}
            className="text-[13px] text-primary hover:text-primary-dark font-medium disabled:opacity-50"
          >
            {resetting ? "Sending…" : "Forgot password?"}
          </button>
        </div>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          show={showPassword}
          setShow={setShowPassword}
        />

        <Button type="submit" loading={loading} className="w-full mt-2">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-sm font-medium text-text-primary", className)}
    >
      {children}
    </label>
  );
}

function Divider() {
  return (
    <div className="relative my-1">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-bg px-3 text-[13px] text-text-secondary">or</span>
      </div>
    </div>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  show,
  setShow,
  autoComplete = "current-password",
  placeholder = "••••••••",
  required = true,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="-mt-2 relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-13 pl-4 pr-12 rounded-md text-base text-text-primary bg-bg border-[1.5px] border-border outline-none transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary/15"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 px-3.5 flex items-center text-text-secondary hover:text-text-primary"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.06-3.72H.95v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.94 10.7A5.41 5.41 0 0 1 3.65 9c0-.59.1-1.16.29-1.7V4.96H.95A9.01 9.01 0 0 0 0 9c0 1.45.35 2.83.95 4.04l2.99-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 9 9 0 0 0 .95 4.96L3.94 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
