"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PasswordInput } from "./LoginForm";
import { cn } from "@/lib/utils";

function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0 as 0 | 1 | 2 | 3 | 4;
  if (pw.length >= 8) score = (score + 1) as typeof score;
  if (/[0-9]/.test(pw)) score = (score + 1) as typeof score;
  if (/[A-Z]/.test(pw)) score = (score + 1) as typeof score;
  if (/[^A-Za-z0-9]/.test(pw)) score = (score + 1) as typeof score;
  return score;
}

const SCORE_LABELS: Record<number, string> = {
  0: "",
  1: "Too short",
  2: "Weak",
  3: "Fair",
  4: "Strong",
};
const SCORE_COLORS: Record<number, string> = {
  0: "bg-border",
  1: "bg-error",
  2: "bg-warning",
  3: "bg-warning",
  4: "bg-success",
};

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

export function SignupForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);
  const [betaFull, setBetaFull] = useState(false);

  const score = passwordScore(password);

  async function checkGate(): Promise<boolean> {
    try {
      const r = await fetch("/api/signup-gate", { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { open?: boolean };
      if (!j.open) {
        setBetaFull(true);
        return false;
      }
      return true;
    } catch {
      // If the gate is unreachable, fail closed — don't accidentally let
      // signups through when the cap can't be enforced.
      setBetaFull(true);
      return false;
    }
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Please enter your name";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Please enter a valid email address";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (!terms) e.terms = "Please accept the terms";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    if (!(await checkGate())) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    // Always derive from the live origin: NEXT_PUBLIC_APP_URL was previously
    // taking precedence and could be wrong-ish-set on Vercel (e.g. localhost
    // leaking into prod), which made confirmation emails point nowhere.
    const appUrl = window.location.origin;
    const next = redirectTo || "/dashboard";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(
          next
        )}`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      toast.success("Account created");
      router.push(next);
      router.refresh();
      return;
    }
    if (data.user) {
      setConfirmedFor(email);
    }
    setLoading(false);
  }

  if (betaFull) {
    return <BetaFullScreen />;
  }

  if (confirmedFor) {
    return (
      <ConfirmationScreen
        email={confirmedFor}
        onChangeEmail={() => setConfirmedFor(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* NAME */}
        <Field label="Full name" htmlFor="signup-name" error={errors.name}>
          <BasicInput
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
          />
        </Field>

        {/* EMAIL */}
        <Field label="Work email" htmlFor="signup-email" error={errors.email}>
          <BasicInput
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
          />
        </Field>

        {/* PASSWORD */}
        <Field
          label="Password"
          htmlFor="signup-password"
          error={errors.password}
        >
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={setPassword}
            show={showPassword}
            setShow={setShowPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
          />
          {password.length > 0 && <StrengthBar score={score} />}
        </Field>

        {/* TERMS */}
        <div className="-mt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]"
            />
            <span className="text-[13px] text-text-secondary leading-relaxed">
              I agree to the{" "}
              <a href="#" className="text-text-primary underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-text-primary underline">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.terms && (
            <p role="alert" className="mt-1.5 text-[13px] text-error">
              {errors.terms}
            </p>
          )}
        </div>

        <Button type="submit" loading={loading} className="w-full mt-1">
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-text-primary mb-1.5"
      >
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-error">
          {error}
        </p>
      )}
    </div>
  );
}

function BasicInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
) {
  const { error, className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cn(
        "w-full h-13 px-4 rounded-md text-base text-text-primary bg-bg",
        "border-[1.5px] outline-none transition-all duration-150",
        error
          ? "border-error focus:border-error focus:ring-[3px] focus:ring-error/15"
          : "border-border focus:border-primary focus:ring-[3px] focus:ring-primary/15",
        className
      )}
    />
  );
}

function StrengthBar({ score }: { score: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors duration-200",
              seg <= score ? SCORE_COLORS[score] : "bg-border"
            )}
          />
        ))}
      </div>
      {SCORE_LABELS[score] && (
        <span className="text-[12px] text-text-secondary shrink-0">
          {SCORE_LABELS[score]}
        </span>
      )}
    </div>
  );
}

function ConfirmationScreen({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
  const toast = useToast();
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function resend() {
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Confirmation email resent");
    setCooldown(60);
  }

  return (
    <div className="flex flex-col items-center text-center [animation:sf-fade-in_280ms_ease]">
      <EnvelopeMark />
      <h2 className="mt-5 text-[22px] font-semibold text-text-primary">
        Check your email
      </h2>
      <p className="mt-2 text-[15px] text-text-secondary leading-[1.7]">
        We sent a confirmation link to{" "}
        <span className="block text-text-primary font-medium mt-1">
          {email}
        </span>
        Click it to activate your account and start building.
      </p>
      <p className="mt-4 text-[13px] text-text-secondary">
        Check your spam folder if you don&apos;t see it within a few minutes.
      </p>

      <button
        type="button"
        onClick={resend}
        disabled={cooldown > 0 || resending}
        className={cn(
          "mt-3 text-sm font-medium transition",
          cooldown > 0 || resending
            ? "text-text-secondary"
            : "text-primary hover:text-primary-dark"
        )}
      >
        {resending
          ? "Sending..."
          : cooldown > 0
          ? `Resend in ${cooldown}s`
          : "Resend confirmation email"}
      </button>

      <button
        type="button"
        onClick={onChangeEmail}
        className="mt-4 text-[13px] text-text-secondary hover:text-text-primary"
      >
        Use a different email
      </button>
    </div>
  );
}

function EnvelopeMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      aria-hidden="true"
      className="text-primary"
    >
      <circle
        cx={32}
        cy={32}
        r={28}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        style={{
          strokeDasharray: 176,
          strokeDashoffset: 176,
          animation: "sf-draw-circle 400ms ease forwards",
        }}
      />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 110,
          strokeDashoffset: 110,
          animation: "sf-draw-envelope 300ms ease 400ms forwards",
        }}
      >
        <rect x={20} y={24} width={24} height={16} rx={2} />
        <polyline points="20,26 32,35 44,26" />
      </g>
      <style>{`
        @keyframes sf-draw-circle { to { stroke-dashoffset: 0 } }
        @keyframes sf-draw-envelope { to { stroke-dashoffset: 0 } }
      `}</style>
    </svg>
  );
}

function BetaFullScreen() {
  return (
    <div className="flex flex-col items-center text-center [animation:sf-fade-in_280ms_ease]">
      <div className="h-16 w-16 rounded-full bg-primary-light grid place-content-center">
        <span className="text-2xl">🚦</span>
      </div>
      <h2 className="mt-5 text-[22px] font-semibold text-text-primary">
        Beta is full
      </h2>
      <p className="mt-2 text-[15px] text-text-secondary leading-[1.7] max-w-[340px]">
        We&apos;ve hit our 25-user cap for the SassyForge beta. Drop us a line at{" "}
        <a
          href="mailto:hello@sassyforge.app"
          className="text-primary hover:text-primary-dark font-medium"
        >
          hello@sassyforge.app
        </a>{" "}
        and we&apos;ll add you to the next wave.
      </p>
      <a
        href="/"
        className="mt-5 text-sm text-primary hover:text-primary-dark font-medium"
      >
        ← Back to home
      </a>
    </div>
  );
}
