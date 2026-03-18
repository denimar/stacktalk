"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { X, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskMessageResponse } from "@/lib/feed-types";
import { TypingUser } from "@/hooks/use-feed-sse";
import { type FileViewerFile } from "@/components/feed/file-viewer";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import { TypingIndicator } from "./typing-indicator";

interface ThreadPanelProps {
  parentMessage: TaskMessageResponse;
  projectId: string;
  currentUserId?: string;
  onClose: () => void;
  sendMessage: (content: string, parentMessageId?: string, attachments?: { s3Key: string; fileName: string; fileType: string; fileSize: number }[]) => Promise<unknown>;
  sendTyping: (parentMessageId?: string) => Promise<void>;
  loadThreadReplies: (messageId: string) => Promise<void>;
  threadMessages: Map<string, TaskMessageResponse[]>;
  typingUsers: TypingUser[];
  onOpenFileViewer?: (file: FileViewerFile) => void;
}

export function ThreadPanel({
  parentMessage,
  projectId,
  currentUserId,
  onClose,
  sendMessage,
  sendTyping,
  loadThreadReplies,
  threadMessages,
  typingUsers,
  onOpenFileViewer,
}: ThreadPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const replies = useMemo(
    () => threadMessages.get(parentMessage.id) ?? [],
    [threadMessages, parentMessage.id]
  );

  useEffect(() => {
    loadThreadReplies(parentMessage.id);
  }, [parentMessage.id, loadThreadReplies]);

  useEffect(() => {
    requestAnimationFrame(() => panelRef.current?.focus());
  }, []);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed top-0 right-0 z-40 flex h-full w-full flex-col outline-none sm:w-[420px]",
          "border-l border-[var(--border-subtle)] bg-[var(--bg-primary)]",
          "shadow-2xl shadow-black/30",
          "animate-slide-in-right"
        )}
        role="dialog"
        aria-label="Thread"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <MessageSquareText className="size-4 text-[var(--text-muted)]" />
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
            Thread
          </h2>
          <span className="text-[12px] text-[var(--text-muted)]">
            {parentMessage.replyCount}{" "}
            {parentMessage.replyCount === 1 ? "reply" : "replies"}
          </span>
          <button
            onClick={onClose}
            className={cn(
              "ml-auto rounded-md p-1.5 transition-colors",
              "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            )}
            title="Close thread (Esc)"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="border-b border-[var(--border-subtle)] pb-2">
            <MessageBubble
              message={parentMessage}
              currentUserId={currentUserId}
              onOpenFileViewer={onOpenFileViewer}
            />
          </div>

          {replies.length > 0 && (
            <div className="px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                <span className="text-[11px] font-medium text-[var(--text-muted)] select-none">
                  {replies.length}{" "}
                  {replies.length === 1 ? "reply" : "replies"}
                </span>
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
              </div>
            </div>
          )}

          {replies.map((reply) => (
            <MessageBubble
              key={reply.id}
              message={reply}
              currentUserId={currentUserId}
              onOpenFileViewer={onOpenFileViewer}
            />
          ))}

          <div ref={repliesEndRef} />
        </div>

        <TypingIndicator
          typingUsers={typingUsers}
          currentUserId={currentUserId}
          parentMessageId={parentMessage.id}
        />

        <MessageComposer
          projectId={projectId}
          taskId={parentMessage.taskId}
          parentMessageId={parentMessage.id}
          sendMessage={sendMessage}
          sendTyping={sendTyping}
          autoFocus
          placeholder="Reply in thread..."
        />
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
