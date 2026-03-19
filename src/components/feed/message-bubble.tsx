"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Loader2,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  Download,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TaskMessageResponse } from "@/lib/feed-types";
import { resolveFileForViewer, type FileViewerFile } from "@/components/feed/file-viewer";

interface MessageBubbleProps {
  message: TaskMessageResponse;
  currentUserId?: string;
  isEditing?: boolean;
  isAgentWorking?: boolean;
  onThreadClick?: (messageId: string) => void;
  onStartEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  editMessage?: (messageId: string, content: string) => Promise<unknown>;
  onOpenFileViewer?: (file: FileViewerFile) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatClockTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getFileIconByExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);
  const videoExts = new Set(["mp4", "webm", "mov", "avi", "mkv"]);
  const audioExts = new Set(["mp3", "wav", "ogg", "flac", "aac", "m4a"]);
  const codeExts = new Set(["js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "css", "html", "json", "xml", "yaml", "yml", "toml", "md", "sh", "sql"]);
  const archiveExts = new Set(["zip", "tar", "gz", "rar", "7z", "bz2", "xz"]);
  const spreadsheetExts = new Set(["csv", "xls", "xlsx", "ods"]);
  if (imageExts.has(ext)) return { icon: FileImage, color: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (videoExts.has(ext)) return { icon: FileVideo, color: "text-purple-400", bg: "bg-purple-500/10" };
  if (audioExts.has(ext)) return { icon: FileAudio, color: "text-amber-400", bg: "bg-amber-500/10" };
  if (ext === "pdf") return { icon: FileText, color: "text-red-400", bg: "bg-red-500/10" };
  if (codeExts.has(ext)) return { icon: FileCode, color: "text-sky-400", bg: "bg-sky-500/10" };
  if (archiveExts.has(ext)) return { icon: FileArchive, color: "text-orange-400", bg: "bg-orange-500/10" };
  if (spreadsheetExts.has(ext)) return { icon: FileSpreadsheet, color: "text-green-400", bg: "bg-green-500/10" };
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext)) return { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" };
  if (["ppt", "pptx", "odp"].includes(ext)) return { icon: FileText, color: "text-orange-400", bg: "bg-orange-500/10" };
  return { icon: FileIcon, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-elevated)]" };
}

function renderFileAttachment(
  url: string,
  label: string,
  index: number,
  onOpenFileViewer?: (file: FileViewerFile) => void
): React.ReactNode {
  const nameMatch = label.match(/^📎\s*(.+?)\s*\(([^)]+)\)$/);
  if (!nameMatch) return null;
  const fileName = nameMatch[1];
  const fileSize = nameMatch[2];
  const { icon: TypeIcon, color, bg } = getFileIconByExtension(fileName);
  const viewerFile = resolveFileForViewer(url, fileName);
  const isViewable = !!viewerFile && !!onOpenFileViewer;
  const handleClick = (e: React.MouseEvent) => {
    if (isViewable) {
      e.preventDefault();
      onOpenFileViewer(viewerFile);
    }
  };
  return (
    <a
      key={`file-${index}`}
      href={url}
      download={isViewable ? undefined : fileName}
      target={isViewable ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "mt-1.5 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors no-underline",
        "border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 hover:bg-[var(--bg-hover)]/60",
        "max-w-xs group/file cursor-pointer"
      )}
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", bg)}>
        <TypeIcon className={cn("size-4.5", color)} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
          {fileName}
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {fileSize}
          {isViewable && (
            <span className="ml-1.5 text-[var(--accent-primary)]">
              — Click to preview
            </span>
          )}
        </p>
      </div>
      <Download
        className="size-4 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover/file:opacity-100"
        strokeWidth={1.5}
      />
    </a>
  );
}

function renderContent(
  content: string,
  onOpenFileViewer?: (file: FileViewerFile) => void
): React.ReactNode {
  const combinedRegex = /(?:!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]*)\]\(([^)]+)\))/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = combinedRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).replace(/^\n+|\n+$/g, "");
      if (textBefore) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {renderInlineMarkdown(textBefore)}
          </span>
        );
      }
    }
    if (match[1] !== undefined || (match[0].startsWith("!["))) {
      const alt = match[1] ?? "";
      const src = match[2] ?? "";
      const imageFile: FileViewerFile = {
        url: src,
        fileName: alt || "image.png",
        fileType: "image",
      };
      const canPreview = !!onOpenFileViewer;
      segments.push(
        <Image
          key={`img-${match.index}`}
          src={src}
          alt={alt || "image"}
          className={cn(
            "mt-1.5 max-h-[150px] max-w-sm rounded-lg border border-[var(--border-subtle)] object-cover",
            canPreview && "cursor-pointer transition-opacity hover:opacity-80"
          )}
          loading="lazy"
          width={384}
          height={150}
          unoptimized
          onClick={canPreview ? () => onOpenFileViewer(imageFile) : undefined}
        />
      );
    } else {
      const label = match[3] ?? "";
      const url = match[4] ?? "";
      const fileCard = renderFileAttachment(url, label, match.index, onOpenFileViewer);
      if (fileCard) {
        segments.push(fileCard);
      } else {
        segments.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] underline underline-offset-2 hover:brightness-110"
          >
            {label}
          </a>
        );
      }
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).replace(/^\n+/, "");
    if (remaining) {
      segments.push(
        <span key={`text-${lastIndex}`}>
          {renderInlineMarkdown(remaining)}
        </span>
      );
    }
  }
  if (segments.length === 0) {
    return renderInlineMarkdown(content);
  }
  return segments;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-[4px] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--accent-primary)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function AgentWorkingIndicator() {
  return (
    <div className="mt-0.5 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block size-[5px] rounded-full bg-[var(--accent-primary)]"
              style={{
                animation: "agent-working-dot 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </span>
        <span
          className="text-[13px] font-medium text-[var(--accent-primary)]"
          style={{
            animation: "agent-working-pulse 2.4s ease-in-out infinite",
          }}
        >
          Working on it...
        </span>
      </div>
      <style jsx>{`
        @keyframes agent-working-dot {
          0%, 70%, 100% { opacity: 0.25; transform: scale(0.85); }
          35% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes agent-working-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function MessageBubble({
  message,
  currentUserId,
  isEditing = false,
  isAgentWorking = false,
  onThreadClick,
  onStartEdit,
  onCancelEdit,
  editMessage,
  onOpenFileViewer,
}: MessageBubbleProps) {
  const isOwn = message.authorId === currentUserId;
  const hasThread = message.replyCount > 0;
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditContent(message.content);
      requestAnimationFrame(() => {
        const el = editRef.current;
        if (!el) return;
        el.focus();
        el.selectionStart = el.value.length;
        el.selectionEnd = el.value.length;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
      });
    }
  }, [isEditing, message.content]);

  const handleSaveEdit = useCallback(async () => {
    const trimmed = editContent.trim();
    if (!trimmed || !editMessage || isSaving) return;
    if (trimmed === message.content) {
      onCancelEdit?.();
      return;
    }
    setIsSaving(true);
    try {
      await editMessage(message.id, trimmed);
      onCancelEdit?.();
    } catch (error) {
      console.error("Failed to edit message", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [editContent, editMessage, isSaving, message.content, message.id, onCancelEdit]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelEdit?.();
      }
    },
    [handleSaveEdit, onCancelEdit]
  );

  const replyAuthors = useMemo(
    () => message.replyAuthors ?? [],
    [message.replyAuthors]
  );

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-5 py-3 transition-colors duration-150",
        isEditing
          ? "bg-[var(--accent-primary)]/[0.04]"
          : "hover:bg-[var(--bg-hover)]/40"
      )}
    >
      <Avatar size="default" className="mt-0.5 shrink-0">
        {message.author.avatar ? (
          <AvatarImage src={message.author.avatar} />
        ) : null}
        <AvatarFallback className="text-[11px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
          {getInitials(message.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-bold leading-tight text-[var(--text-primary)]">
            {message.author.name}
          </span>
          <span
            className="text-[11px] text-[var(--text-muted)] select-none"
            title={formatAbsoluteTime(message.createdAt)}
          >
            {formatClockTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span
              className="text-[10px] italic text-[var(--text-muted)]/60"
              title={
                message.editedAt
                  ? `Edited ${formatAbsoluteTime(message.editedAt)}`
                  : "Edited"
              }
            >
              (edited)
            </span>
          )}
        </div>

        {isAgentWorking ? (
          <AgentWorkingIndicator />
        ) : isEditing ? (
          <div className="mt-1">
            <div
              className={cn(
                "rounded-lg border transition-colors",
                "border-[var(--accent-primary)]/30 bg-[var(--bg-surface)]",
                "focus-within:border-[var(--accent-primary)]/50"
              )}
            >
              <textarea
                ref={editRef}
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                }}
                onKeyDown={handleEditKeyDown}
                disabled={isSaving}
                rows={1}
                className={cn(
                  "w-full resize-none bg-transparent px-3 py-2 text-[14px] leading-relaxed",
                  "text-[var(--text-primary)] outline-none disabled:opacity-50"
                )}
                style={{ overflowY: "hidden" }}
              />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <span>
                <span className="font-medium">Esc</span> to cancel
              </span>
              <span className="text-[var(--border-medium)]">|</span>
              <span>
                <span className="font-medium">Enter</span> to save
              </span>
              {isSaving && (
                <Loader2 className="ml-1 size-3 animate-spin text-[var(--accent-primary)]" />
              )}
            </div>
          </div>
        ) : (
          <div className="mt-0.5 text-[14px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap break-words">
            {renderContent(message.content, onOpenFileViewer)}
          </div>
        )}

        {!isEditing && hasThread && (
          <button
            onClick={() => onThreadClick?.(message.id)}
            className="mt-2 flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-[var(--bg-hover)]/60 group/thread"
          >
            {replyAuthors.length > 0 && (
              <AvatarGroup className="mr-0.5">
                {replyAuthors.map((author) => (
                  <Avatar key={author.id} size="sm" className="ring-[var(--bg-primary)]">
                    {author.avatar ? (
                      <AvatarImage src={author.avatar} />
                    ) : null}
                    <AvatarFallback className="text-[8px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      {getInitials(author.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            )}
            <span className="text-[12px] font-semibold text-[var(--accent-primary)] group-hover/thread:underline">
              {message.replyCount}{" "}
              {message.replyCount === 1 ? "reply" : "replies"}
            </span>
            {message.lastReplyAt && (
              <span className="text-[11px] text-[var(--text-muted)]">
                Last reply {formatRelativeTime(message.lastReplyAt)}
              </span>
            )}
          </button>
        )}
      </div>

      {!isEditing && (
        <div className="absolute top-1.5 right-3 flex items-center gap-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onThreadClick?.(message.id)}
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            title="Reply in thread"
          >
            <MessageSquare className="size-3.5" />
          </button>
          {isOwn && (
            <button
              onClick={() => onStartEdit?.(message.id)}
              className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Edit message"
            >
              <svg
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
