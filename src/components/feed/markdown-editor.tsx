"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ClipboardEvent,
  type DragEvent,
  type ChangeEvent,
} from "react";
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Heading2,
  Link,
  Quote,
  Eye,
  Pencil,
  Paperclip,
  Loader2,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import {
  type Attachment,
  isImageFile,
  getFileTypeIcon,
  getFileTypeColor,
  formatFileSize,
  uploadFile,
} from "@/lib/file-utils";
import {
  FileViewer,
  resolveFileForViewer,
  type FileViewerFile,
} from "@/components/feed/file-viewer";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  enableAttachments?: boolean;
  disabled?: boolean;
  taskId?: string;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

interface ToolbarAction {
  icon: typeof Bold;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Heading2, label: "Heading", prefix: "## ", suffix: "", block: true },
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "_", suffix: "_" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  { icon: Quote, label: "Quote", prefix: "> ", suffix: "", block: true },
  { icon: List, label: "Bullet list", prefix: "- ", suffix: "", block: true },
  { icon: ListOrdered, label: "Numbered list", prefix: "1. ", suffix: "", block: true },
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)" },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your requirements using Markdown...",
  minHeight = 200,
  enableAttachments = false,
  disabled = false,
  taskId,
  onAttachmentsChange,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewerFile, setViewerFile] = useState<FileViewerFile | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const pendingMessageIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAttachmentsChangeRef = useRef(onAttachmentsChange);
  onAttachmentsChangeRef.current = onAttachmentsChange;

  const updateAttachments = useCallback(
    (updater: (prev: Attachment[]) => Attachment[]) => {
      setAttachments((prev) => {
        const next = updater(prev);
        queueMicrotask(() => onAttachmentsChangeRef.current?.(next));
        return next;
      });
    },
    []
  );

  const addAttachment = useCallback(
    (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = isImageFile(file) ? URL.createObjectURL(file) : "";
      const attachment: Attachment = { id, file, previewUrl, uploading: true };
      updateAttachments((prev) => [...prev, attachment]);
      const resolvedTaskId = taskId && taskId !== "general" ? taskId : "general";
      uploadFile({ file, taskId: resolvedTaskId, messageId: pendingMessageIdRef.current }).then((result) => {
        if (result) {
          updateAttachments((prev) =>
            prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    uploading: false,
                    uploadedUrl: result.url,
                    uploadedS3Key: result.s3Key,
                    uploadedFileName: result.fileName,
                    uploadedFileType: result.fileType,
                    uploadedFileSize: result.fileSize,
                  }
                : a
            )
          );
        } else {
          updateAttachments((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, uploading: false, error: "Upload failed" } : a
            )
          );
        }
      });
    },
    [updateAttachments, taskId]
  );

  const removeAttachment = useCallback(
    (id: string) => {
      updateAttachments((prev) => {
        const toRemove = prev.find((a) => a.id === id);
        if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
        return prev.filter((a) => a.id !== id);
      });
    },
    [updateAttachments]
  );

  const openAttachmentPreview = useCallback((attachment: Attachment) => {
    if (!attachment.uploadedUrl) return;
    const fileName = attachment.uploadedFileName || attachment.file.name;
    const file = resolveFileForViewer(attachment.uploadedUrl, fileName);
    if (file) {
      setViewerFile(file);
    } else {
      window.open(attachment.uploadedUrl, "_blank");
    }
  }, []);

  const applyFormat = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      let newText: string;
      let cursorOffset: number;
      if (action.block) {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const before = value.substring(0, lineStart);
        const after = value.substring(start === end ? start : end);
        const line = selectedText || "text";
        newText = before + action.prefix + line + action.suffix + after;
        cursorOffset = lineStart + action.prefix.length + line.length;
      } else {
        const before = value.substring(0, start);
        const after = value.substring(end);
        const wrapped = selectedText || "text";
        newText = before + action.prefix + wrapped + action.suffix + after;
        cursorOffset = start + action.prefix.length + wrapped.length;
      }
      onChange(newText);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorOffset, cursorOffset);
      });
    },
    [value, onChange]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (!enableAttachments) return;
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;
      e.preventDefault();
      fileArray.forEach(addAttachment);
    },
    [enableAttachments, addAttachment]
  );

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (!enableAttachments) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer.types.includes("Files")) {
        setIsDragOver(true);
      }
    },
    [enableAttachments]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (!enableAttachments) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragOver(false);
      }
    },
    [enableAttachments]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (!enableAttachments) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [enableAttachments]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (!enableAttachments) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach(addAttachment);
    },
    [enableAttachments, addAttachment]
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

  return (
    <div
      className={cn(
        "rounded-lg border bg-[var(--bg-primary)] overflow-hidden transition-colors duration-150",
        isDragOver
          ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20"
          : "border-[var(--border-subtle)]"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {enableAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPreview || disabled}
                title="Attach files"
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  isPreview || disabled
                    ? "text-[var(--text-muted)]/30 cursor-not-allowed"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Paperclip className="size-3.5" strokeWidth={1.8} />
              </button>
              <div className="mx-0.5 h-4 w-px bg-[var(--border-subtle)]" />
            </>
          )}
          {TOOLBAR_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => applyFormat(action)}
                disabled={isPreview || disabled}
                title={action.label}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  isPreview || disabled
                    ? "text-[var(--text-muted)]/30 cursor-not-allowed"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.8} />
              </button>
            );
          })}
        </div>
        <div className="flex items-center rounded-md bg-[var(--bg-primary)] p-0.5">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-all",
              !isPreview
                ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Pencil className="size-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-all",
              isPreview
                ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Eye className="size-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor / Preview area */}
      <div className="relative">
        {isDragOver && enableAttachments && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-lg bg-[var(--accent-primary)]/[0.06] backdrop-blur-[1px] border-2 border-dashed border-[var(--accent-primary)]/30">
            <div className="flex flex-col items-center gap-1.5 text-[var(--accent-primary)]">
              <Paperclip className="size-5" />
              <span className="text-[12px] font-medium">Drop files to attach</span>
            </div>
          </div>
        )}

        {isPreview ? (
          <div
            className="prose prose-invert prose-sm max-w-none px-3 py-3 text-[13px] text-[var(--text-primary)] overflow-y-auto scrollbar-thin"
            style={{ minHeight }}
          >
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-[var(--text-muted)]/50 italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full resize-y bg-transparent px-3 py-3 text-[13px] leading-relaxed",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40",
              "outline-none scrollbar-thin",
              "disabled:opacity-50"
            )}
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Attachments strip */}
      {enableAttachments && attachments.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-3 py-2.5">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => {
              const isImage = isImageFile(attachment.file);
              const TypeIcon = getFileTypeIcon(attachment.file);
              const typeColor = getFileTypeColor(attachment.file);

              if (isImage) {
                return (
                  <div
                    key={attachment.id}
                    className="group relative size-[72px] shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                  >
                    <button
                      type="button"
                      onClick={() => openAttachmentPreview(attachment)}
                      disabled={attachment.uploading || !!attachment.error}
                      className="size-full cursor-pointer disabled:cursor-default"
                      title="Click to preview"
                    >
                      <img
                        src={attachment.previewUrl}
                        alt="attachment preview"
                        className="size-full object-cover"
                      />
                    </button>
                    {attachment.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="size-4 animate-spin text-white" />
                      </div>
                    )}
                    {attachment.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-900/60">
                        <span className="text-[10px] font-medium text-white">Failed</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeAttachment(attachment.id); }}
                      className="absolute -top-1 -right-1 z-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-medium)] p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
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
                    "group relative flex items-center gap-2 rounded-lg border px-2.5 py-2",
                    "border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60",
                    "min-w-0 max-w-[200px]",
                    !attachment.uploading && !attachment.error && "cursor-pointer hover:bg-[var(--bg-hover)]/40"
                  )}
                  onClick={() => openAttachmentPreview(attachment)}
                  role={attachment.uploadedUrl ? "button" : undefined}
                  tabIndex={attachment.uploadedUrl ? 0 : undefined}
                  title={attachment.uploadedUrl ? "Click to preview" : undefined}
                >
                  <div className={cn("shrink-0", typeColor)}>
                    <TypeIcon className="size-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                      {attachment.file.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {formatFileSize(attachment.file.size)}
                    </p>
                  </div>
                  {attachment.uploading && (
                    <Loader2 className="size-3 shrink-0 animate-spin text-[var(--accent-primary)]" />
                  )}
                  {attachment.error && (
                    <span className="shrink-0 text-[9px] font-medium text-red-400">Failed</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeAttachment(attachment.id); }}
                    className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-medium)] p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    title="Remove"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
          {enableAttachments && (
            <p className="mt-1.5 text-[10px] text-[var(--text-muted)]/40 select-none">
              Paste, drag & drop, or click <Paperclip className="inline size-2.5 -mt-px" /> to attach files
            </p>
          )}
        </div>
      )}

      {viewerFile && (
        <FileViewer file={viewerFile} onClose={() => setViewerFile(null)} />
      )}
    </div>
  );
}
