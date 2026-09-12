import { NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";

export async function POST(request: Request) {
  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const { code, hostToken } = createRoom(name);
  return NextResponse.json({ code, hostToken, ok: true });
}