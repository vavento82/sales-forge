import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-[1100px] px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Logo />
          <span className="text-text-secondary">© {year} SassyForge</span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-text-secondary">
          <Link href="/pricing" className="hover:text-text-primary transition">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-text-primary transition">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-text-primary transition">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
