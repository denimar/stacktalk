"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import {
  Bold,
  Italic,
  Code,
  Link,
  SendHorizonal,
  Loader2,
  X,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Attachment,
  isImageFile,
  getFileTypeIcon,
  getFileTypeColor,
  formatFileSize,
  uploadFile as uploadFileUtil,
} from "@/lib/file-utils";

interface MessageComposerProps {
  projectId: string;
  taskId?: string | null;
  parentMessageId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSend?: () => void;
  sendMessage: (content: string, parentMessageId?: string, attachments?: AttachmentPayload[]) => Promise<unknown>;
  sendTyping: (parentMessageId?: string) => Promise<void>;
}

interface AttachmentPayload {
  s3Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

const TYPING_THROTTLE_MS = 2000;

interface FormatAction {
  icon: typeof Bold;
  label: string;
  prefix: string;
  suffix: string;
}

const FORMAT_ACTIONS: FormatAction[] = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "_", suffix: "_" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)" },
];

function generateUUID(): string {
  return crypto.randomUUID();
}

export function MessageComposer({
  projectId,
  taskId,
  parentMessageId,
  placeholder,
  autoFocus = true,
  onSend,
  sendMessage,
  sendTyping,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef(0);
  const dragCounterRef = useRef(0);
  const pendingMessageIdRef = useRef<string>(generateUUID());

  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [autoFocus, parentMessageId]);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAttachment = useCallback(
    (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = isImageFile(file) ? URL.createObjectURL(file) : "";
      const attachment: Attachment = { id, file, previewUrl, uploading: true };
      setAttachments((prev) => [...prev, attachment]);
      const resolvedTaskId = taskId && taskId !== "general" ? taskId : "general";
      uploadFileUtil({ file, taskId: resolvedTaskId, messageId: pendingMessageIdRef.current }).then((result) => {
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === id
              ? result
                ? {
                    ...a,
                    uploading: false,
                    uploadedUrl: result.url,
                    uploadedS3Key: result.s3Key,
                    uploadedFileName: result.fileName,
                    uploadedFileType: result.fileType,
                    uploadedFileSize: result.fileSize,
                  }
                : { ...a, uploading: false, error: "Upload failed" }
              : a
          )
        );
      });
    },
    [taskId]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const toRemove = prev.find((a) => a.id === id);
      if (toRemove && toRemove.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 160;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const handleSend = useCallback(async () => {
    const uploadedAttachments = attachments.filter((a) => a.uploadedUrl);
    const trimmed = content.trim();
    if ((!trimmed && uploadedAttachments.length === 0) || isSending) return;
    setIsSending(true);
    try {
      const attachmentParts = uploadedAttachments
        .map((a) => {
          if (isImageFile(a.file)) {
            return `![image](${a.uploadedUrl})`;
          }
          const name = a.uploadedFileName || a.file.name;
          const size = formatFileSize(a.file.size);
          return `[📎 ${name} (${size})](${a.uploadedUrl})`;
        })
        .join("\n");
      const fullContent = [trimmed, attachmentParts].filter(Boolean).join("\n");
      const attachmentPayloads: AttachmentPayload[] = uploadedAttachments
        .filter((a) => a.uploadedS3Key)
        .map((a) => ({
          s3Key: a.uploadedS3Key!,
          fileName: a.uploadedFileName || a.file.name,
          fileType: a.uploadedFileType || a.file.type,
          fileSize: a.uploadedFileSize || a.file.size,
        }));
      await sendMessage(fullContent, parentMessageId, attachmentPayloads.length > 0 ? attachmentPayloads : undefined);
      setContent("");
      setAttachments([]);
      pendingMessageIdRef.current = generateUUID();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      onSend?.();
    } catch (error) {
      console.error("Failed to send message", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [content, isSending, sendMessage, parentMessageId, onSend, attachments]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      adjustHeight();
      const now = Date.now();
      if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
        lastTypingSentRef.current = now;
        sendTyping(parentMessageId);
      }
    },
    [adjustHeight, sendTyping, parentMessageId]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;
      e.preventDefault();
      fileArray.forEach(addAttachment);
    },
    [addAttachment]
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach(addAttachment);
    },
    [addAttachment]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach(addAttachment);
      e.target.value = "";
    },
    [addAttachment]
  );

  const applyFormat = useCallback(
    (action: FormatAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.slice(start, end);
      const replacement = `${action.prefix}${selected || "text"}${action.suffix}`;
      const newContent =
        content.slice(0, start) + replacement + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = selected
          ? start + replacement.length
          : start + action.prefix.length;
        const selectEnd = selected
          ? cursorPos
          : cursorPos + "text".length;
        textarea.setSelectionRange(
          selected ? selectEnd : cursorPos,
          selectEnd
        );
        adjustHeight();
      });
    },
    [content, adjustHeight]
  );

  const hasUploadedAttachments = attachments.some((a) => a.uploadedUrl);
  const canSend =
    (content.trim().length > 0 || hasUploadedAttachments) && !isSending;

  return (
    <div
      className="shrink-0 border-t border-[var(--border-subtle)] px-5 py-3"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "relative rounded-xl border transition-colors duration-150",
          isDragOver
            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/[0.06] ring-2 ring-[var(--accent-primary)]/20"
            : "border-[var(--border-medium)] bg-[var(--bg-surface)]",
          "focus-within:border-[var(--accent-primary)]/40 focus-within:ring-1 focus-within:ring-[var(--accent-primary)]/10"
        )}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[var(--accent-primary)]/[0.04] backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--accent-primary)]">
              <Paperclip className="size-4" />
              Drop files to attach
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            placeholder ??
            (parentMessageId ? "Reply in thread..." : "Message #general")
          }
          disabled={isSending}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[14px] leading-relaxed",
            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60",
            "outline-none disabled:opacity-50"
          )}
          style={{ overflowY: "hidden" }}
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {attachments.map((attachment) => {
              const isImage = isImageFile(attachment.file);
              const TypeIcon = getFileTypeIcon(attachment.file);
              const typeColor = getFileTypeColor(attachment.file);

              if (isImage) {
                return (
                  <div
                    key={attachment.id}
                    className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)]"
                  >
                    <img
                      src={attachment.previewUrl}
                      alt="attachment preview"
                      className="size-full object-cover"
                    />
                    {attachment.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="size-5 animate-spin text-white" />
                      </div>
                    )}
                    {attachment.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-900/60">
                        <span className="text-[10px] font-medium text-white">
                          Failed
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white transition-colors hover:bg-black/80"
                      title="Remove"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={attachment.id}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5",
                    "border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60",
                    "min-w-0 max-w-[220px]"
                  )}
                >
                  <div className={cn("shrink-0", typeColor)}>
                    <TypeIcon className="size-5" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                      {attachment.file.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {formatFileSize(attachment.file.size)}
                    </p>
                  </div>
                  {attachment.uploading && (
                    <Loader2 className="size-3.5 shrink-0 animate-spin text-[var(--accent-primary)]" />
                  )}
                  {attachment.error && (
                    <span className="shrink-0 text-[10px] font-medium text-red-400">
                      Failed
                    </span>
                  )}
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-medium)] p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    title="Remove"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              title="Attach files"
              className={cn(
                "rounded-md p-1.5 transition-colors",
                "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]",
                "disabled:pointer-events-none disabled:opacity-40"
              )}
            >
              <Paperclip className="size-4" strokeWidth={1.8} />
            </button>
            <div className="mx-0.5 h-4 w-px bg-[var(--border-subtle)]" />
            {FORMAT_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => applyFormat(action)}
                disabled={isSending}
                title={action.label}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]",
                  "disabled:pointer-events-none disabled:opacity-40"
                )}
              >
                <action.icon className="size-4" strokeWidth={1.8} />
              </button>
            ))}
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            title="Send message"
            className={cn(
              "flex items-center justify-center rounded-lg p-2 transition-all duration-150",
              canSend
                ? "bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-sm shadow-[var(--accent-primary)]/20 hover:brightness-110"
                : "text-[var(--text-muted)]/40 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizonal className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-1 px-1 text-[11px] text-[var(--text-muted)]/40 select-none">
        <span className="font-medium">Enter</span> to send,{" "}
        <span className="font-medium">Shift+Enter</span> for new line
        <span className="ml-2">
          <span className="font-medium">Ctrl+V</span> to paste files
        </span>
      </div>
    </div>
  );
}
