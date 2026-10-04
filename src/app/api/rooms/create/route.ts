import { NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";
import { isNameTooLong, NAME_LENGTH_ERROR } from "@/lib/roomLimits";

export async function POST(request: Request) {
  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }
  const raw = body.name?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (isNameTooLong(raw)) {
    return NextResponse.json({ error: NAME_LENGTH_ERROR }, { status: 400 });
  }
  const { code, hostToken } = createRoom(raw);
  return NextResponse.json({ code, hostToken, ok: true });
}