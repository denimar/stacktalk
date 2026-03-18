import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import sseBus from "@/lib/sse-bus";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";
import { TaskMessageResponse, TaskMessageAuthor } from "@/lib/feed-types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const { id } = await params;
    const body = await request.json();
    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: "Missing required field", required: ["content"] },
        { status: 400 }
      );
    }
    const existingMessage = await prisma.taskMessage.findUnique({
      where: { id },
    });
    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }
    if (
      existingMessage.authorType !== "user" ||
      existingMessage.authorId !== authResult.id
    ) {
      return NextResponse.json(
        { error: "You can only edit your own messages" },
        { status: 403 }
      );
    }
    const updated = await prisma.taskMessage.update({
      where: { id },
      data: {
        content: body.content.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
    });
    const author: TaskMessageAuthor = {
      id: authResult.id,
      name: authResult.name,
      avatar: authResult.avatar,
      role: authResult.role,
    };
    const response: TaskMessageResponse = {
      id: updated.id,
      content: updated.content,
      authorType: updated.authorType,
      authorId: updated.authorId,
      projectId: updated.projectId,
      taskId: updated.taskId,
      parentMessageId: updated.parentMessageId,
      replyCount: updated.replyCount,
      lastReplyAt: null,
      replyAuthors: [],
      isEdited: updated.isEdited,
      editedAt: updated.editedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      author,
    };
    sseBus.publish({
      type: "message:updated",
      payload: response as unknown as Record<string, unknown>,
      projectId: updated.projectId,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to edit feed message", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
