import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return "https://" + s.replace(/^\/+/, "");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  let body: { default_cta_url?: string };
  try {
    body = (await request.json()) as { default_cta_url?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const incoming = (body.default_cta_url || "").trim();
  const normalised = incoming ? normalize(incoming) : "";
  if (normalised && !/^https?:\/\/[^\s.]+\.[^\s]+/.test(normalised)) {
    return NextResponse.json(
      { error: "Enter a valid URL (e.g. example.com/book)" },
      { status: 400 }
    );
  }
  const { error } = await supabase
    .from("users_profile")
    .update({ default_cta_url: normalised || null })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, default_cta_url: normalised });
}
