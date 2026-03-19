"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Hash,
  Search,
  ChevronDown,
  ChevronRight,
  Bug,
  Sparkles,
  CheckSquare,
  Circle,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskSidebarItem {
  id: string;
  title: string;
  description: string;
  type: "bug" | "feature" | "task";
  status: "todo" | "waiting_approval" | "in_progress" | "qa" | "done";
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TaskSidebarProps {
  tasks: TaskSidebarItem[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onOpenCreateModal?: () => void;
  isLoading: boolean;
}

const STATUS_CONFIG = {
  todo: { label: "To Do", icon: Circle, color: "text-[var(--text-muted)]", bg: "bg-[var(--text-muted)]/10" },
  waiting_approval: { label: "Waiting", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
  in_progress: { label: "In Progress", icon: Loader2, color: "text-[var(--accent-primary)]", bg: "bg-[var(--accent-primary)]/10" },
  qa: { label: "QA", icon: AlertCircle, color: "text-purple-400", bg: "bg-purple-400/10" },
  done: { label: "Done", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

const TYPE_ICON = {
  bug: Bug,
  feature: Sparkles,
  task: CheckSquare,
};

const STATUS_ORDER: TaskSidebarItem["status"][] = [
  "in_progress",
  "waiting_approval",
  "qa",
  "todo",
  "done",
];

export function TaskSidebar({
  tasks,
  selectedTaskId,
  onSelectTask,
  onOpenCreateModal,
  isLoading,
}: TaskSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(STATUS_ORDER)
  );
  const [sectionsInitialized, setSectionsInitialized] = useState(false);
  if (!sectionsInitialized && tasks.length > 0) {
    setSectionsInitialized(true);
    const selectedItem = selectedTaskId && selectedTaskId !== "general"
      ? tasks.find((t) => t.id === selectedTaskId)
      : null;
    const openStatus = selectedItem
      ? selectedItem.status
      : STATUS_ORDER.find((s) => tasks.some((t) => t.status === s));
    setCollapsedSections(new Set(STATUS_ORDER.filter((s) => s !== openStatus)));
  }
  const isGeneralSelected = selectedTaskId === "general" || selectedTaskId === null;
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, searchQuery]);
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, TaskSidebarItem[]>();
    for (const status of STATUS_ORDER) {
      const items = filteredTasks.filter((t) => t.status === status);
      if (items.length > 0) {
        groups.set(status, items);
      }
    }
    return groups;
  }, [filteredTasks]);
  const toggleSection = useCallback((status: string) => {
    setCollapsedSections((prev) => {
      if (prev.has(status)) {
        const next = new Set(STATUS_ORDER as string[]);
        next.delete(status);
        return next;
      }
      return new Set(STATUS_ORDER.filter((s) => s !== status));
    });
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );
  const [prevSelectedStatus, setPrevSelectedStatus] = useState<string | null>(null);
  const currentStatus = selectedTask?.status ?? null;
  if (currentStatus !== prevSelectedStatus) {
    setPrevSelectedStatus(currentStatus);
    if (currentStatus) {
      setCollapsedSections(new Set(STATUS_ORDER.filter((s) => s !== currentStatus)));
    }
  }

  return (
    <div className="flex h-full flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]">
      <div className="shrink-0 px-3.5 pt-4 pb-2">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Tasks
          </h2>
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className={cn(
                "flex size-5 items-center justify-center rounded-md transition-all duration-150",
                "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
              )}
              title="New task"
            >
              <Plus className="size-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full rounded-lg border bg-[var(--bg-surface)] py-1.5 pl-8 pr-8 text-[12px]",
              "border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50",
              "outline-none transition-colors",
              "focus:border-[var(--accent-primary)]/30 focus:ring-1 focus:ring-[var(--accent-primary)]/10"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>
      <div className="px-2 py-1">
        <button
          onClick={() => onSelectTask("general")}
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150",
            isGeneralSelected
              ? "bg-[var(--accent-primary)]/[0.08] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-primary)]"
          )}
        >
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-md transition-colors",
              isGeneralSelected
                ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                : "bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
            )}
          >
            <Hash className="size-3.5" strokeWidth={2} />
          </div>
          <span className="flex-1 truncate text-[13px] font-medium">
            general
          </span>
          {isGeneralSelected && (
            <div className="size-1.5 rounded-full bg-[var(--accent-primary)]" />
          )}
        </button>
      </div>
      <div className="mx-3 my-1 h-px bg-[var(--border-subtle)]" />
      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="size-5 animate-spin rounded-full border-2 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)]" />
            <span className="text-[11px] text-[var(--text-muted)]">
              Loading tasks...
            </span>
          </div>
        ) : groupedTasks.size === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-8 text-center">
            <CheckSquare className="size-5 text-[var(--text-muted)]/40" />
            <span className="text-[12px] text-[var(--text-muted)]">
              {searchQuery ? "No tasks match" : "No tasks yet"}
            </span>
          </div>
        ) : (
          Array.from(groupedTasks.entries()).map(([status, items]) => {
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
            const isCollapsed = collapsedSections.has(status);
            return (
              <div key={status} className="mb-1">
                <button
                  onClick={() => toggleSection(status)}
                  className="group/section flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-hover)]/30"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3 text-[var(--text-muted)] transition-transform" />
                  ) : (
                    <ChevronDown className="size-3 text-[var(--text-muted)] transition-transform" />
                  )}
                  <span className={cn("text-[11px] font-semibold uppercase tracking-wide", config.color)}>
                    {config.label}
                  </span>
                  <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
                    {items.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {items.map((task) => {
                      const isSelected = selectedTaskId === task.id;
                      const TypeIcon = TYPE_ICON[task.type];
                      return (
                        <button
                          key={task.id}
                          onClick={() => onSelectTask(task.id)}
                          className={cn(
                            "group flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-all duration-150",
                            "h-[55px] min-h-[55px] max-h-[55px] overflow-hidden",
                            isSelected
                              ? "bg-[var(--accent-primary)]/[0.08] text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-primary)]"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
                              isSelected
                                ? cn(config.bg, config.color)
                                : "bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                            )}
                          >
                            <TypeIcon className="size-3.5" strokeWidth={1.8} />
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="line-clamp-2 text-[13px] font-medium leading-snug">
                              {task.title}
                            </span>
                            {task.messageCount > 0 && (
                              <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--text-muted)]">
                                {task.messageCount} msg
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <div className="size-1.5 shrink-0 rounded-full bg-[var(--accent-primary)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
