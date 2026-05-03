import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  // Spec uses `next`; legacy callsites use `redirect`. Honour either.
  const redirectTo =
    url.searchParams.get("next") ||
    url.searchParams.get("redirect") ||
    "/dashboard";
  const errorDescription =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  if (errorDescription) {
    const target = new URL("/login", url);
    target.searchParams.set("error", errorDescription);
    return NextResponse.redirect(target);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const target = new URL("/login", url);
      target.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(target);
    }
  }

  return NextResponse.redirect(new URL(redirectTo, url));
}
