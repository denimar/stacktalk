"use client";

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Hash,
  Wifi,
  WifiOff,
  PanelLeftClose,
  PanelLeftOpen,
  Bug,
  Sparkles,
  CheckSquare,
  FolderOpen,
} from "lucide-react";
import { useFeedSSE } from "@/hooks/use-feed-sse";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProjectContext } from "@/contexts/ProjectContext";
import { MessageFeed } from "@/components/feed/message-feed";
import { MessageComposer } from "@/components/feed/message-composer";
import { ThreadPanel } from "@/components/feed/thread-panel";
import { TypingIndicator } from "@/components/feed/typing-indicator";
import { TaskSidebar, type TaskSidebarItem } from "@/components/feed/task-sidebar";
import { CreateTaskModal } from "@/components/feed/create-task-modal";
import { cn } from "@/lib/utils";
import { FileViewer, type FileViewerFile } from "@/components/feed/file-viewer";

const TYPE_ICON = {
  bug: Bug,
  feature: Sparkles,
  task: CheckSquare,
};

function FeedContent() {
  const { selectedProjectId, selectedProject } = useProjectContext();
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskParam = searchParams.get("task");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    taskParam || "general"
  );
  const [tasks, setTasks] = useState<TaskSidebarItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarInitialized, setSidebarInitialized] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const prevProjectId = useRef<string | null>(null);

  useEffect(() => {
    if (!sidebarInitialized) {
      setSidebarOpen(window.innerWidth >= 1024);
      setSidebarInitialized(true);
    }
  }, [sidebarInitialized]);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [viewerFile, setViewerFile] = useState<FileViewerFile | null>(null);

  const projectId = selectedProjectId ?? "";

  const refreshTasks = useCallback(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/tasks`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json) => setTasks(json.data ?? []))
      .catch((error) => console.error("Failed to refresh tasks", { error }));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    if (prevProjectId.current !== projectId) {
      const isInitialLoad = prevProjectId.current === null;
      prevProjectId.current = projectId;
      if (isInitialLoad && taskParam) {
        setSelectedTaskId(taskParam);
      } else if (!isInitialLoad) {
        setSelectedTaskId("general");
        setSelectedThreadId(null);
        setEditingMessageId(null);
        const params = new URLSearchParams(window.location.search);
        params.delete("task");
        const qs = params.toString();
        router.replace(`/tasks${qs ? `?${qs}` : ""}`, { scroll: false });
      }
    }
    setTasksLoading(true);
    fetch(`/api/projects/${projectId}/tasks`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((json) => setTasks(json.data ?? []))
      .catch((error) => console.error("Failed to fetch tasks", { error }))
      .finally(() => setTasksLoading(false));
  }, [projectId]);
  const {
    messages,
    threadMessages,
    typingUsers,
    isConnected,
    initialLoaded,
    sendMessage,
    editMessage,
    sendTyping,
    loadThreadReplies,
  } = useFeedSSE(projectId, selectedTaskId, refreshTasks);

  const handleSelectTask = useCallback((taskId: string | null) => {
    const resolvedId = taskId ?? "general";
    setSelectedTaskId(resolvedId);
    setSelectedThreadId(null);
    setEditingMessageId(null);
    const params = new URLSearchParams(window.location.search);
    if (resolvedId === "general") {
      params.delete("task");
    } else {
      params.set("task", resolvedId);
    }
    const qs = params.toString();
    router.replace(`/tasks${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  const handleCreateTask = useCallback(
    async (payload: { title: string; type: "bug" | "feature" | "task"; description: string }) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to create task");
      }
      const json = await res.json();
      const newTask = json.data as TaskSidebarItem;
      setTasks((prev) => [newTask, ...prev]);
      setSelectedTaskId(newTask.id);
      setSelectedThreadId(null);
      setEditingMessageId(null);
      const params = new URLSearchParams(window.location.search);
      params.set("task", newTask.id);
      const qs = params.toString();
      router.replace(`/tasks${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [projectId, router]
  );

  const handleThreadClick = useCallback((messageId: string) => {
    setSelectedThreadId(messageId);
  }, []);

  const handleThreadClose = useCallback(() => {
    setSelectedThreadId(null);
  }, []);

  const handleStartEdit = useCallback((messageId: string) => {
    setEditingMessageId(messageId);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const handleOpenFileViewer = useCallback((file: FileViewerFile) => {
    setViewerFile(file);
  }, []);

  const handleCloseFileViewer = useCallback(() => {
    setViewerFile(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        if (!user?.id) return;
        const ownMessages = messages.filter(
          (m) => m.authorType === "user" && m.authorId === user.id
        );
        if (ownMessages.length === 0) return;
        const lastOwn = ownMessages[ownMessages.length - 1];
        setEditingMessageId(lastOwn.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [messages, user?.id]);

  const selectedParentMessage = useMemo(() => {
    if (!selectedThreadId) return null;
    return messages.find((m) => m.id === selectedThreadId) ?? null;
  }, [selectedThreadId, messages]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId || selectedTaskId === "general") return null;
    return tasks.find((t) => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasks]);

  const channelName = useMemo(() => {
    if (!selectedTask) return "general";
    return selectedTask.title;
  }, [selectedTask]);

  const channelDescription = useMemo(() => {
    if (!selectedTask) return "Project feed — collaborate with your team and agents";
    const statusLabels: Record<string, string> = {
      todo: "To Do",
      waiting_approval: "Waiting Approval",
      in_progress: "In Progress",
      qa: "QA",
      done: "Done",
    };
    return statusLabels[selectedTask.status] ?? selectedTask.status;
  }, [selectedTask]);

  const ChannelIcon = selectedTask ? TYPE_ICON[selectedTask.type] : Hash;

  if (!selectedProjectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[var(--bg-primary)] px-6 text-center">
        <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)] mb-5">
          <FolderOpen className="size-8 text-[var(--text-muted)]" />
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          No project selected
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-xs">
          Select a project from the toolbar to view the feed
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full bg-[var(--bg-primary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Task Sidebar */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-30 w-[280px] transition-transform duration-300 ease-out lg:relative lg:z-0 lg:top-auto lg:bottom-auto",
          "lg:transition-[width,opacity] lg:duration-200",
          sidebarOpen
            ? "translate-x-0 lg:w-[280px] lg:opacity-100"
            : "-translate-x-full lg:w-0 lg:translate-x-0 lg:opacity-0 lg:overflow-hidden"
        )}
      >
        <TaskSidebar
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={(taskId) => {
            handleSelectTask(taskId);
            if (window.innerWidth < 1024) setSidebarOpen(false);
          }}
          onOpenCreateModal={() => setCreateModalOpen(true)}
          isLoading={tasksLoading}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
            )}
            title={sidebarOpen ? "Hide sidebar (Ctrl+B)" : "Show sidebar (Ctrl+B)"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" strokeWidth={1.8} />
            ) : (
              <PanelLeftOpen className="size-4" strokeWidth={1.8} />
            )}
          </button>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div className="flex min-w-0 items-center gap-2">
            <ChannelIcon className="size-4 shrink-0 text-[var(--text-muted)]" />
            <h1 className="truncate text-[14px] font-semibold text-[var(--text-primary)] sm:text-[15px]">
              {channelName}
            </h1>
          </div>
          <div className="mx-1 hidden h-4 w-px bg-[var(--border-subtle)] sm:block" />
          <span className="hidden truncate text-[12px] text-[var(--text-muted)] sm:block">
            {channelDescription}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                isConnected
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-[var(--accent-warm)]/10 text-[var(--accent-warm)]"
              )}
            >
              {isConnected ? (
                <Wifi className="size-3" />
              ) : (
                <WifiOff className="size-3" />
              )}
              <span className="hidden sm:inline">
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>
        </header>

        <MessageFeed
          messages={messages}
          currentUserId={user?.id}
          isConnected={isConnected}
          initialLoaded={initialLoaded}
          onThreadClick={handleThreadClick}
          editMessage={editMessage}
          editingMessageId={editingMessageId}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onOpenFileViewer={handleOpenFileViewer}
        />

        <TypingIndicator
          typingUsers={typingUsers}
          currentUserId={user?.id}
          parentMessageId={null}
        />

        <MessageComposer
          projectId={projectId}
          taskId={selectedTaskId}
          sendMessage={sendMessage}
          sendTyping={sendTyping}
          placeholder={
            selectedTask
              ? `Message #${selectedTask.title.toLowerCase().slice(0, 30)}...`
              : "Message #general"
          }
        />
      </div>

      {selectedParentMessage && (
        <ThreadPanel
          parentMessage={selectedParentMessage}
          projectId={projectId}
          currentUserId={user?.id}
          onClose={handleThreadClose}
          sendMessage={sendMessage}
          sendTyping={sendTyping}
          loadThreadReplies={loadThreadReplies}
          threadMessages={threadMessages}
          typingUsers={typingUsers}
          onOpenFileViewer={handleOpenFileViewer}
        />
      )}

      <FileViewer file={viewerFile} onClose={handleCloseFileViewer} />

      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}
