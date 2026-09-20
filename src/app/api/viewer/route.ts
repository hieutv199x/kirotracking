import { NextResponse } from "next/server";
import { VIEWER_COOKIE } from "@/lib/viewer";
import { DEVELOPERS } from "@/lib/catalog";

export async function POST(request: Request) {
  const body = (await request.json()) as { viewer?: string };
  const viewer = body.viewer ?? "lead";
  const allowed = ["lead", ...DEVELOPERS.map((d) => d.id)];
  if (!allowed.includes(viewer)) {
    return NextResponse.json({ error: "viewer không hợp lệ" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIEWER_COOKIE, viewer, { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}
