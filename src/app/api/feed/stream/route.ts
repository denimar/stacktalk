import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import sseBus, { SSESubscriber } from "@/lib/sse-bus";
import { SSEEvent } from "@/lib/feed-types";

const HEARTBEAT_INTERVAL_MS = 30000;

export async function GET(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return new Response(
      JSON.stringify({ error: "Missing required field", required: ["projectId"] }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  let eventId = 0;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const subscriber: SSESubscriber = (event: SSEEvent) => {
        eventId++;
        const data = `id: ${eventId}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          sseBus.unsubscribe(projectId, subscriber);
        }
      };
      sseBus.subscribe(projectId, subscriber);
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
          sseBus.unsubscribe(projectId, subscriber);
        }
      }, HEARTBEAT_INTERVAL_MS);
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        sseBus.unsubscribe(projectId, subscriber);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
