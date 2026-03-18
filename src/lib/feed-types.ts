import { AuthorType } from "@/generated/prisma/client";

export interface AttachmentPayload {
  s3Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface TaskMessagePayload {
  content: string;
  projectId: string;
  taskId?: string;
  parentMessageId?: string;
  authorType: AuthorType;
  authorId: string;
  attachments?: AttachmentPayload[];
}

export interface TaskMessageAuthor {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

export interface TaskMessageResponse {
  id: string;
  content: string;
  authorType: AuthorType;
  authorId: string;
  projectId: string;
  taskId: string | null;
  parentMessageId: string | null;
  replyCount: number;
  lastReplyAt: string | null;
  replyAuthors: TaskMessageAuthor[];
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: TaskMessageAuthor;
}

export type SSEEventType =
  | "message:created"
  | "message:updated"
  | "thread:reply"
  | "typing"
  | "presence";

export interface SSEEvent {
  type: SSEEventType;
  payload: Record<string, unknown>;
  projectId: string;
}

export interface FeedStreamParams {
  projectId: string;
  lastEventId?: string;
}

export interface TypingPayload {
  projectId: string;
  userId: string;
  userName: string;
  parentMessageId?: string;
}

export interface PresencePayload {
  projectId: string;
  userId: string;
  userName: string;
  status: "online" | "offline";
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;
