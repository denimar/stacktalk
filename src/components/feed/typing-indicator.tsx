"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TypingUser } from "@/hooks/use-feed-sse";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserId?: string;
  parentMessageId?: string | null;
}

export function TypingIndicator({
  typingUsers,
  currentUserId,
  parentMessageId = null,
}: TypingIndicatorProps) {
  const activeTypers = useMemo(() => {
    return typingUsers.filter(
      (t) =>
        t.userId !== currentUserId &&
        t.parentMessageId === parentMessageId
    );
  }, [typingUsers, currentUserId, parentMessageId]);

  if (activeTypers.length === 0) return null;

  const names = activeTypers.map((t) => t.userName);
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-5 py-1.5",
        "text-[12px] text-[var(--text-muted)]",
        "animate-fade-slide-up"
      )}
    >
      <span className="inline-flex gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-[5px] rounded-full bg-[var(--accent-primary)]/50"
            style={{
              animation: "typing-bounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
      <span className="font-medium">{label}</span>
      <style jsx>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
