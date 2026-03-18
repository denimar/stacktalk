import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";
import sseBus from "@/lib/sse-bus";

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const body = await request.json();
    if (!body.projectId) {
      return NextResponse.json(
        { error: "Missing required field", required: ["projectId"] },
        { status: 400 }
      );
    }
    sseBus.publish({
      type: "typing",
      payload: {
        userId: authResult.id,
        userName: authResult.name,
        parentMessageId: body.parentMessageId ?? null,
      },
      projectId: body.projectId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to broadcast typing", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
