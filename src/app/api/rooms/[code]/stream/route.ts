import { getRoom, getSnapshot, subscribe, type RoomViewer } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encode(event: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const hostToken = searchParams.get("hostToken");
  const guestId = searchParams.get("guestId");

  let viewer: RoomViewer;
  if (hostToken && hostToken === room.hostToken) {
    viewer = { role: "host" };
  } else if (guestId) {
    viewer = { role: "guest", guestId };
  } else {
    return new Response("Unauthorized", { status: 401 });
  }

  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      controllerRef = null;
    },
  });

  // Respond immediately so the client's reader attaches as early as possible.
  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

  const initial = getSnapshot(code, viewer);

  const sub = subscribe(code, viewer, (event) => {
    const c = controllerRef;
    if (!c) return;
    if (event.type === "closed") {
      try {
        c.enqueue(encode(event));
        c.close();
      } catch {
        /* already closed */
      }
      return;
    }
    try {
      c.enqueue(encode(event));
    } catch {
      /* stream closed */
    }
  });

  const pushInitial = () => {
    const c = controllerRef;
    if (!c || !initial) return;
    try {
      c.enqueue(encode(initial));
    } catch {
      /* ignored */
    }
  };
  setTimeout(pushInitial, 0);

  const heartbeat = setInterval(() => {
    const c = controllerRef;
    if (!c) return;
    try {
      c.enqueue(encode(`: ping`));
    } catch {
      /* stream closed */
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(heartbeat);
    sub();
  };

  request.signal.addEventListener("abort", cleanup);

  return response;
}