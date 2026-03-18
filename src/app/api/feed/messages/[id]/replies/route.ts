import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";
import {
  TaskMessageResponse,
  TaskMessageAuthor,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "@/lib/feed-types";

async function resolveAuthor(
  authorType: string,
  authorId: string
): Promise<TaskMessageAuthor> {
  if (authorType === "user") {
    const user = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, avatar: true, role: true },
    });
    if (user) return user;
  } else {
    const agent = await prisma.agent.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, avatar: true, role: true },
    });
    if (agent) return agent;
  }
  return { id: authorId, name: "Unknown", avatar: null, role: "user" };
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const [isoDate, id] = decoded.split("|");
    return { createdAt: new Date(isoDate), id };
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const { id } = await params;
    const parentMessage = await prisma.taskMessage.findUnique({
      where: { id },
    });
    if (!parentMessage) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }
    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get("cursor");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam ?? String(DEFAULT_PAGE_LIMIT), 10) || DEFAULT_PAGE_LIMIT, 1),
      MAX_PAGE_LIMIT
    );
    const cursor = cursorParam ? decodeCursor(cursorParam) : null;
    const whereClause: Record<string, unknown> = {
      parentMessageId: id,
    };
    if (cursor) {
      whereClause.OR = [
        { createdAt: { gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { gt: cursor.id } },
      ];
    }
    const replies = await prisma.taskMessage.findMany({
      where: whereClause,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit + 1,
    });
    const hasMore = replies.length > limit;
    const pageReplies = hasMore ? replies.slice(0, limit) : replies;
    const data: TaskMessageResponse[] = await Promise.all(
      pageReplies.map(async (msg) => {
        const author = await resolveAuthor(msg.authorType, msg.authorId);
        return {
          id: msg.id,
          content: msg.content,
          authorType: msg.authorType,
          authorId: msg.authorId,
          projectId: msg.projectId,
          taskId: msg.taskId,
          parentMessageId: msg.parentMessageId,
          replyCount: msg.replyCount,
          lastReplyAt: null,
          replyAuthors: [],
          isEdited: msg.isEdited,
          editedAt: msg.editedAt?.toISOString() ?? null,
          createdAt: msg.createdAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
          author,
        };
      })
    );
    const nextCursor =
      hasMore && pageReplies.length > 0
        ? encodeCursor(
            pageReplies[pageReplies.length - 1].createdAt,
            pageReplies[pageReplies.length - 1].id
          )
        : null;
    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (error) {
    console.error("Failed to fetch thread replies", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
