import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAP = 25;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const res = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "count_failed" }, { status: 502 });
  }
  const data = (await res.json()) as { users?: unknown[] };
  const count = (data.users ?? []).length;
  return NextResponse.json({ open: count < CAP, count, cap: CAP });
}
