import { NextResponse } from "next/server";
import { joinRoom } from "@/lib/rooms";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let body: { guestId?: string; name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.guestId || !body.name?.trim()) {
    return NextResponse.json({ ok: false, error: "guestId and name required" }, { status: 400 });
  }

  const res = joinRoom(code, body.guestId, body.name.trim());
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, guestStatus: res.guestStatus });
}