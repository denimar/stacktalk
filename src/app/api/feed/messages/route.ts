import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import sseBus from "@/lib/sse-bus";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";
import {
  TaskMessagePayload,
  TaskMessageResponse,
  TaskMessageAuthor,
  AttachmentPayload,
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

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "Missing required field", required: ["projectId"] },
        { status: 400 }
      );
    }
    const cursorParam = searchParams.get("cursor");
    const limitParam = searchParams.get("limit");
    const taskIdParam = searchParams.get("taskId");
    const limit = Math.min(
      Math.max(parseInt(limitParam ?? String(DEFAULT_PAGE_LIMIT), 10) || DEFAULT_PAGE_LIMIT, 1),
      MAX_PAGE_LIMIT
    );
    const cursor = cursorParam ? decodeCursor(cursorParam) : null;
    const whereClause: Record<string, unknown> = {
      projectId,
      parentMessageId: null,
    };
    if (taskIdParam === "general") {
      whereClause.taskId = null;
    } else if (taskIdParam) {
      whereClause.taskId = taskIdParam;
    }
    if (cursor) {
      whereClause.OR = [
        { createdAt: { gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { gt: cursor.id } },
      ];
    }
    const messages = await prisma.taskMessage.findMany({
      where: whereClause,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit + 1,
    });
    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;
    const messagesWithReplies = pageMessages.filter((m) => m.replyCount > 0);
    const threadMetaMap = new Map<
      string,
      { lastReplyAt: string; replyAuthors: TaskMessageAuthor[] }
    >();
    if (messagesWithReplies.length > 0) {
      const parentIds = messagesWithReplies.map((m) => m.id);
      const lastReplies = await prisma.$queryRawUnsafe<
        { parent_message_id: string; last_reply_at: Date }[]
      >(
        `SELECT "parent_message_id", MAX("created_at") as "last_reply_at" FROM "task_messages" WHERE "parent_message_id" IN (${parentIds.map((_, i) => `$${i + 1}`).join(",")}) GROUP BY "parent_message_id"`,
        ...parentIds
      );
      const replyAuthorsRaw = await prisma.$queryRawUnsafe<
        { parent_message_id: string; author_type: string; author_id: string; rn: bigint }[]
      >(
        `SELECT * FROM (SELECT "parent_message_id", "author_type", "author_id", ROW_NUMBER() OVER (PARTITION BY "parent_message_id" ORDER BY MAX("created_at") DESC) as rn FROM "task_messages" WHERE "parent_message_id" IN (${parentIds.map((_, i) => `$${i + 1}`).join(",")}) GROUP BY "parent_message_id", "author_type", "author_id") sub WHERE rn <= 3`,
        ...parentIds
      );
      for (const row of lastReplies) {
        threadMetaMap.set(row.parent_message_id, {
          lastReplyAt: new Date(row.last_reply_at).toISOString(),
          replyAuthors: [],
        });
      }
      const authorEntries = await Promise.all(
        replyAuthorsRaw.map(async (row) => ({
          parentMessageId: row.parent_message_id,
          author: await resolveAuthor(row.author_type, row.author_id),
        }))
      );
      for (const entry of authorEntries) {
        const meta = threadMetaMap.get(entry.parentMessageId);
        if (meta) meta.replyAuthors.push(entry.author);
      }
    }
    const data: TaskMessageResponse[] = await Promise.all(
      pageMessages.map(async (msg) => {
        const author = await resolveAuthor(msg.authorType, msg.authorId);
        const threadMeta = threadMetaMap.get(msg.id);
        return {
          id: msg.id,
          content: msg.content,
          authorType: msg.authorType,
          authorId: msg.authorId,
          projectId: msg.projectId,
          taskId: msg.taskId,
          parentMessageId: msg.parentMessageId,
          replyCount: msg.replyCount,
          lastReplyAt: threadMeta?.lastReplyAt ?? null,
          replyAuthors: threadMeta?.replyAuthors ?? [],
          isEdited: msg.isEdited,
          editedAt: msg.editedAt?.toISOString() ?? null,
          createdAt: msg.createdAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
          author,
        };
      })
    );
    const nextCursor =
      hasMore && pageMessages.length > 0
        ? encodeCursor(
            pageMessages[pageMessages.length - 1].createdAt,
            pageMessages[pageMessages.length - 1].id
          )
        : null;
    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (error) {
    console.error("Failed to fetch feed messages", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const body = (await request.json()) as Partial<TaskMessagePayload>;
    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: "Missing required field", required: ["content"] },
        { status: 400 }
      );
    }
    if (!body.projectId) {
      return NextResponse.json(
        { error: "Missing required field", required: ["projectId"] },
        { status: 400 }
      );
    }
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    if (body.parentMessageId) {
      const parentMessage = await prisma.taskMessage.findUnique({
        where: { id: body.parentMessageId },
      });
      if (!parentMessage) {
        return NextResponse.json(
          { error: "Parent message not found" },
          { status: 404 }
        );
      }
    }
    const isThreadReply = !!body.parentMessageId;
    const attachments = (body as Record<string, unknown>).attachments as AttachmentPayload[] | undefined;
    const message = await prisma.$transaction(async (tx) => {
      const taskId = (body as Record<string, unknown>).taskId as string | undefined;
      const created = await tx.taskMessage.create({
        data: {
          content: body.content!.trim(),
          authorType: "user",
          authorId: authResult.id,
          projectId: body.projectId!,
          taskId: taskId && taskId !== "general" ? taskId : null,
          parentMessageId: body.parentMessageId ?? null,
        },
      });
      if (attachments && attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((att) => ({
            messageId: created.id,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            s3Key: att.s3Key,
            attachmentType: att.fileType.split("/")[0] || "file",
          })),
        });
      }
      if (isThreadReply) {
        await tx.taskMessage.update({
          where: { id: body.parentMessageId! },
          data: { replyCount: { increment: 1 } },
        });
      }
      return created;
    });
    const author: TaskMessageAuthor = {
      id: authResult.id,
      name: authResult.name,
      avatar: authResult.avatar,
      role: authResult.role,
    };
    const response: TaskMessageResponse = {
      id: message.id,
      content: message.content,
      authorType: message.authorType,
      authorId: message.authorId,
      projectId: message.projectId,
      taskId: message.taskId,
      parentMessageId: message.parentMessageId,
      replyCount: message.replyCount,
      lastReplyAt: null,
      replyAuthors: [],
      isEdited: message.isEdited,
      editedAt: message.editedAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      author,
    };
    sseBus.publish({
      type: isThreadReply ? "thread:reply" : "message:created",
      payload: response as unknown as Record<string, unknown>,
      projectId: message.projectId,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to create feed message", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
