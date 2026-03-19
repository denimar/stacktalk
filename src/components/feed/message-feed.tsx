"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskMessageResponse } from "@/lib/feed-types";
import { type FileViewerFile } from "@/components/feed/file-viewer";
import { MessageBubble } from "./message-bubble";

const WORKING_MESSAGE = "Working on it...";

interface MessageFeedProps {
  messages: TaskMessageResponse[];
  currentUserId?: string;
  isConnected: boolean;
  initialLoaded: boolean;
  onThreadClick?: (messageId: string) => void;
  editMessage?: (messageId: string, content: string) => Promise<unknown>;
  editingMessageId?: string | null;
  onStartEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onLoadOlder?: () => void;
  onOpenFileViewer?: (file: FileViewerFile) => void;
}

export function MessageFeed({
  messages,
  currentUserId,
  isConnected,
  initialLoaded,
  onThreadClick,
  editMessage,
  editingMessageId,
  onStartEdit,
  onCancelEdit,
  onLoadOlder,
  onOpenFileViewer,
}: MessageFeedProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const prevMessageCountRef = useRef(messages.length);

  useEffect(() => {
    if (!isAtBottom && messages.length > prevMessageCountRef.current) {
      setNewMessageCount(
        (prev) => prev + (messages.length - prevMessageCountRef.current)
      );
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isAtBottom]);

  const handleAtBottomChange = useCallback((atBottom: boolean) => {
    setIsAtBottom(atBottom);
    if (atBottom) {
      setNewMessageCount(0);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: "LAST",
      behavior: "smooth",
    });
    setNewMessageCount(0);
  }, []);

  const workingMessageIds = useMemo(() => {
    const ids = new Set<string>();
    const agentLastIndex = new Map<string, number>();
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.authorType !== "agent") continue;
      if (!agentLastIndex.has(msg.authorId)) {
        agentLastIndex.set(msg.authorId, i);
      }
    }
    for (const [, lastIdx] of agentLastIndex) {
      const msg = messages[lastIdx];
      if (msg.content === WORKING_MESSAGE) {
        ids.add(msg.id);
      }
    }
    return ids;
  }, [messages]);

  if (!initialLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)]" />
          <span className="text-[13px] text-[var(--text-muted)]">
            Loading messages...
          </span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--bg-elevated)]">
            <svg
              className="size-6 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[var(--text-secondary)]">
            No messages yet
          </p>
          <p className="text-[12px] text-[var(--text-muted)]">
            Start the conversation — type a message below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      {!isConnected && (
        <div className="absolute top-0 right-0 left-0 z-10 border-b border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5 px-4 py-1.5 text-center text-[12px] text-[var(--accent-warm)]">
          Reconnecting...
        </div>
      )}

      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        followOutput="smooth"
        atBottomStateChange={handleAtBottomChange}
        atBottomThreshold={80}
        startReached={onLoadOlder}
        increaseViewportBy={{ top: 400, bottom: 200 }}
        itemContent={(_, message) => (
          <MessageBubble
            message={message}
            currentUserId={currentUserId}
            isEditing={editingMessageId === message.id}
            isAgentWorking={workingMessageIds.has(message.id)}
            onThreadClick={onThreadClick}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            editMessage={editMessage}
            onOpenFileViewer={onOpenFileViewer}
          />
        )}
        className="scrollbar-thin"
        style={{ height: "100%" }}
      />

      {!isAtBottom && newMessageCount > 0 && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 left-1/2 z-10 -translate-x-1/2",
            "inline-flex items-center gap-1.5 rounded-full",
            "border border-[var(--accent-primary)]/20 bg-[var(--bg-surface)] px-3 py-1.5",
            "text-[12px] font-medium text-[var(--accent-primary)] shadow-lg shadow-black/20",
            "transition-all hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-elevated)]",
            "animate-fade-slide-up"
          )}
        >
          <ChevronDown className="size-3.5" />
          {newMessageCount} new {newMessageCount === 1 ? "message" : "messages"}
        </button>
      )}
    </div>
  );
}
