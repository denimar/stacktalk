"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Bug,
  Sparkles,
  CheckSquare,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MarkdownEditor } from "@/components/feed/markdown-editor";
import { cn } from "@/lib/utils";
import { type Attachment, buildAttachmentMarkdown } from "@/lib/file-utils";

type TaskType = "bug" | "feature" | "task";

interface CreateTaskPayload {
  title: string;
  type: TaskType;
  description: string;
}

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
}

const TYPE_OPTIONS: { value: TaskType; label: string; icon: typeof Bug; description: string }[] = [
  { value: "task", label: "Task", icon: CheckSquare, description: "General work item" },
  { value: "feature", label: "Feature", icon: Sparkles, description: "New functionality" },
  { value: "bug", label: "Bug", icon: Bug, description: "Something broken" },
];

export function CreateTaskModal({ open, onOpenChange, onCreateTask }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("task");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [open]);

  const resetForm = useCallback(() => {
    setTitle("");
    setType("task");
    setDescription("");
    setAttachments([]);
    setIsSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    onOpenChange(false);
    resetForm();
  }, [isSaving, onOpenChange, resetForm]);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) return;
    setIsSaving(true);
    try {
      const uploadedParts = attachments
        .filter((a) => a.uploadedUrl)
        .map((a) => buildAttachmentMarkdown(a))
        .filter(Boolean);
      const fullDescription = [description.trim(), ...uploadedParts]
        .filter(Boolean)
        .join("\n");
      await onCreateTask({ title: trimmedTitle, type, description: fullDescription });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create task", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setIsSaving(false);
    }
  }, [title, type, description, attachments, isSaving, onCreateTask, onOpenChange, resetForm]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "sm:max-w-[560px]",
          "bg-[var(--bg-surface)] text-[var(--text-primary)]",
          "border border-[var(--border-subtle)]",
          "ring-0"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-[var(--text-primary)]">
            Create Task
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--text-muted)]">
            Define a new task for your project
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              disabled={isSaving}
              placeholder="What needs to be done?"
              className={cn(
                "w-full rounded-lg border bg-[var(--bg-primary)] px-3 py-2 text-[13px]",
                "border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40",
                "outline-none transition-colors",
                "focus:border-[var(--accent-primary)]/30 focus:ring-1 focus:ring-[var(--accent-primary)]/10",
                "disabled:opacity-50"
              )}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Type
            </label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    disabled={isSaving}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all duration-150",
                      isActive
                        ? "border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/[0.06]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)]/30",
                      "disabled:opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        isActive
                          ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                          : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "text-[12px] font-semibold",
                          isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                        )}
                      >
                        {option.label}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Requirements
            </label>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the requirements in detail using Markdown..."
              minHeight={160}
              enableAttachments
              disabled={isSaving}
              onAttachmentsChange={setAttachments}
            />
          </div>
        </div>
        <DialogFooter
          className={cn(
            "bg-[var(--bg-secondary)]/50 border-[var(--border-subtle)]",
            "sm:flex-row sm:justify-between"
          )}
        >
          <span className="hidden text-[11px] text-[var(--text-muted)]/50 sm:block">
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-1 py-0.5 text-[10px] font-mono">
              Ctrl+Enter
            </kbd>{" "}
            to create
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className={cn(
                "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 py-1.5 text-[12px] font-medium",
                "text-[var(--text-secondary)] transition-colors",
                "hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                "disabled:opacity-50"
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || isSaving}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-semibold transition-all duration-150",
                title.trim() && !isSaving
                  ? "bg-[var(--accent-primary)] text-white shadow-sm shadow-[var(--accent-primary)]/20 hover:brightness-110"
                  : "bg-[var(--text-muted)]/10 text-[var(--text-muted)]/40 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckSquare className="size-3.5" />
              )}
              Create Task
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
