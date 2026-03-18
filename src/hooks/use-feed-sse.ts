"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TaskMessageResponse } from "@/lib/feed-types";

const MAX_RECONNECT_DELAY_MS = 30000;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const TYPING_TIMEOUT_MS = 3000;

export interface TypingUser {
  userId: string;
  userName: string;
  parentMessageId: string | null;
  expiresAt: number;
}

export function useFeedSSE(projectId: string, taskId?: string | null, onAgentMessage?: () => void) {
  const [messages, setMessages] = useState<TaskMessageResponse[]>([]);
  const [threadMessages, setThreadMessages] = useState<
    Map<string, TaskMessageResponse[]>
  >(new Map());
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onAgentMessageRef = useRef(onAgentMessage);
  onAgentMessageRef.current = onAgentMessage;

  const loadInitialMessages = useCallback(async () => {
    setMessages([]);
    setInitialLoaded(false);
    try {
      const taskParam = taskId !== undefined && taskId !== null ? `&taskId=${taskId}` : "";
      const res = await fetch(`/api/feed/messages?projectId=${projectId}${taskParam}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data);
        setInitialLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load initial messages", { error });
    }
  }, [projectId, taskId]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const es = new EventSource(`/api/feed/stream?projectId=${projectId}`);
    eventSourceRef.current = es;
    es.onopen = () => {
      setIsConnected(true);
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
    };
    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
    es.addEventListener("message:created", (e) => {
      const msg = JSON.parse(e.data) as TaskMessageResponse;
      if (msg.authorType === "agent" && onAgentMessageRef.current) {
        onAgentMessageRef.current();
      }
      const matchesTask =
        taskId === undefined || taskId === null
          ? true
          : taskId === "general"
            ? msg.taskId === null
            : msg.taskId === taskId;
      if (!matchesTask) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    es.addEventListener("message:updated", (e) => {
      const msg = JSON.parse(e.data) as TaskMessageResponse;
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? msg : m))
      );
      setThreadMessages((prev) => {
        const parentId = msg.parentMessageId;
        if (!parentId) return prev;
        const threadMsgs = prev.get(parentId);
        if (!threadMsgs) return prev;
        const next = new Map(prev);
        next.set(
          parentId,
          threadMsgs.map((m) => (m.id === msg.id ? msg : m))
        );
        return next;
      });
    });
    es.addEventListener("thread:reply", (e) => {
      const msg = JSON.parse(e.data) as TaskMessageResponse;
      const parentId = msg.parentMessageId;
      if (!parentId) return;
      setThreadMessages((prev) => {
        const next = new Map(prev);
        const existing = next.get(parentId) ?? [];
        if (existing.some((m) => m.id === msg.id)) return prev;
        next.set(parentId, [...existing, msg]);
        return next;
      });
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== parentId) return m;
          const replyAuthors = m.replyAuthors.some((a) => a.id === msg.author.id)
            ? m.replyAuthors
            : [msg.author, ...m.replyAuthors].slice(0, 3);
          return {
            ...m,
            replyCount: m.replyCount + 1,
            lastReplyAt: msg.createdAt,
            replyAuthors,
          };
        })
      );
    });
    es.addEventListener("typing", (e) => {
      const data = JSON.parse(e.data) as {
        userId: string;
        userName: string;
        parentMessageId: string | null;
      };
      setTypingUsers((prev) => {
        const filtered = prev.filter((t) => t.userId !== data.userId);
        return [
          ...filtered,
          { ...data, expiresAt: Date.now() + TYPING_TIMEOUT_MS },
        ];
      });
    });
  }, [projectId, taskId]);

  useEffect(() => {
    if (!projectId) return;
    loadInitialMessages();
    connect();
    typingTimerRef.current = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const filtered = prev.filter((t) => t.expiresAt > now);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 1000);
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [connect, loadInitialMessages]);

  const sendMessage = useCallback(
    async (content: string, parentMessageId?: string, attachments?: { s3Key: string; fileName: string; fileType: string; fileSize: number }[]) => {
      const res = await fetch("/api/feed/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, projectId, taskId: taskId ?? undefined, parentMessageId, attachments }),
      });
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      return res.json();
    },
    [projectId, taskId]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      const res = await fetch(`/api/feed/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        throw new Error("Failed to edit message");
      }
      return res.json();
    },
    []
  );

  const sendTyping = useCallback(
    async (parentMessageId?: string) => {
      try {
        await fetch("/api/feed/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, parentMessageId }),
        });
      } catch {
        // ignore typing errors
      }
    },
    [projectId]
  );

  const loadThreadReplies = useCallback(
    async (messageId: string) => {
      const res = await fetch(
        `/api/feed/messages/${messageId}/replies?projectId=${projectId}`
      );
      if (res.ok) {
        const json = await res.json();
        setThreadMessages((prev) => {
          const next = new Map(prev);
          next.set(messageId, json.data);
          return next;
        });
      }
    },
    [projectId]
  );

  return {
    messages,
    threadMessages,
    typingUsers,
    isConnected,
    initialLoaded,
    sendMessage,
    editMessage,
    sendTyping,
    loadThreadReplies,
  };
}
