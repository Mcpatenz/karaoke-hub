import { NextResponse } from "next/server";
import {
  addQueueItem,
  approveGuest,
  denyGuest,
  endRoom,
  leaveRoom,
  queueControl,
  removeGuest,
  updateRoomSettings,
  type QueueControlAction,
} from "@/lib/rooms";
import type { QueueItem } from "@/stores/queueStore";
import type { HostSettings } from "@/lib/roomSettings";

interface ActionBody {
  action?: string;
  control?: string;
  hostToken?: string;
  guestId?: string;
  item?: QueueItem;
  settings?: HostSettings;
  toIndex?: number;
  id?: string;
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let body: ActionBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  switch (body.action) {
    case "approve":
      return respond(approveGuest(code, body.hostToken ?? "", body.guestId ?? ""));
    case "deny":
      return respond(denyGuest(code, body.hostToken ?? "", body.guestId ?? ""));
    case "remove":
      return respond(removeGuest(code, body.hostToken ?? "", body.guestId ?? ""));
    case "leave":
      return respond(leaveRoom(code, body.guestId ?? ""));
    case "end":
      return respond(endRoom(code, body.hostToken ?? ""));
    case "add-song": {
      if (!body.item) {
        return NextResponse.json({ ok: false, error: "item required" }, { status: 400 });
      }
      return respond(addQueueItem(code, { hostToken: body.hostToken, guestId: body.guestId }, body.item));
    }
    case "queue-control":
      if (!body.control) {
        return NextResponse.json({ ok: false, error: "control required" }, { status: 400 });
      }
      return respond(
        queueControl(code, body.hostToken ?? "", body.control as QueueControlAction, {
          id: body.id,
          toIndex: body.toIndex,
        }),
      );
    case "settings":
      if (!body.settings) {
        return NextResponse.json({ ok: false, error: "settings required" }, { status: 400 });
      }
      return respond(updateRoomSettings(code, body.hostToken ?? "", body.settings));
    default:
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }
}

function respond(res: { ok: boolean; error?: string }): NextResponse {
  if (res.ok) return NextResponse.json({ ok: true });
  const status = res.error === "Not authorized" ? 401 : 400;
  return NextResponse.json({ ok: false, error: res.error }, { status });
}