"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  FolderOpen,
  GitBranch,
} from "lucide-react";
import { useProjectContext } from "@/contexts/ProjectContext";
import type { ProjectItem } from "@/hooks/useProjects";

interface ProjectManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalView = "list" | "form";

interface FormData {
  name: string;
  description: string;
  gitRepository: string;
  setupInstructions: string;
}

const EMPTY_FORM: FormData = { name: "", description: "", gitRepository: "", setupInstructions: "" };

export function ProjectManagementModal({
  open,
  onOpenChange,
}: ProjectManagementModalProps) {
  const { projects, addProject, updateProject, deleteProject } =
    useProjectContext();
  const [view, setView] = useState<ModalView>("list");
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setView("list");
      setEditingProject(null);
      setForm(EMPTY_FORM);
      setConfirmDeleteId(null);
      setToast(null);
    }
  }, [open]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function handleStartCreate() {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setView("form");
  }

  function handleStartEdit(project: ProjectItem) {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description,
      gitRepository: project.gitRepository,
      setupInstructions: project.setupInstructions,
    });
    setView("form");
  }

  function handleCancelForm() {
    setView("list");
    setEditingProject(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast("error", "Project name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, form);
        showToast("success", "Project updated");
      } else {
        await addProject(form);
        showToast("success", "Project created");
      }
      setView("list");
      setEditingProject(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    try {
      await deleteProject(id);
      showToast("success", "Project archived");
      setConfirmDeleteId(null);
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Failed to archive"
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="sm:max-w-[540px] w-full p-0 overflow-hidden bg-[var(--bg-surface)] ring-1 ring-[var(--border-medium)] shadow-2xl shadow-[var(--shadow-color)]"
      >
        <div className="sr-only">
          <DialogTitle>Manage Projects</DialogTitle>
          <DialogDescription>
            Add, edit, or archive your projects
          </DialogDescription>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={cn(
              "absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg animate-fade-slide-up",
              toast.type === "success"
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                : "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"
            )}
          >
            {toast.type === "success" ? (
              <Check className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="px-6 pt-10 pb-4 pr-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                {view === "list" ? "Projects" : editingProject ? "Edit project" : "New project"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {view === "list"
                  ? `${projects.length} project${projects.length !== 1 ? "s" : ""}`
                  : editingProject
                    ? "Update project details"
                    : "Set up a new project"}
              </p>
            </div>
            {view === "list" && (
              <Button
                onClick={handleStartCreate}
                className="h-8 px-3 text-xs font-medium rounded-lg bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-md shadow-[var(--accent-primary)]/20 transition-all duration-200"
              >
                <Plus className="size-3.5 mr-1" />
                New
              </Button>
            )}
          </div>
        </div>

        <Separator className="bg-[var(--border-subtle)]" />

        {/* List view */}
        {view === "list" && (
          <div className="max-h-[400px] overflow-y-auto">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)] mb-4">
                  <FolderOpen className="size-6 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  No projects yet
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Create your first project to get started
                </p>
                <Button
                  onClick={handleStartCreate}
                  className="mt-5 h-9 px-4 text-sm font-medium rounded-lg bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-md shadow-[var(--accent-primary)]/20"
                >
                  <Plus className="size-4 mr-1.5" />
                  Create project
                </Button>
              </div>
            ) : (
              <div className="px-2 py-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors duration-150"
                  >
                    {/* Project icon */}
                    <div className="shrink-0 flex items-center justify-center size-9 rounded-lg bg-[var(--accent-primary)]/8 ring-1 ring-[var(--accent-primary)]/15">
                      <FolderOpen className="size-4 text-[var(--accent-primary)]" />
                    </div>

                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {project.name}
                      </p>
                      {project.description ? (
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                          {project.description}
                        </p>
                      ) : project.gitRepository ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <GitBranch className="size-3 text-[var(--text-muted)]" />
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            {project.gitRepository}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => handleStartEdit(project)}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                        title="Edit project"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {confirmDeleteId === project.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(project.id)}
                            disabled={deletingId === project.id}
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                            title="Confirm archive"
                          >
                            {deletingId === project.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Archive project"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form view */}
        {view === "form" && (
          <div className="p-6 animate-fade-slide-up">
            <div className="space-y-5">
              <FormField label="Project name" required>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="My awesome project"
                  autoFocus
                  className="h-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200"
                />
              </FormField>

              <FormField label="Description">
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of the project"
                  className="h-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200"
                />
              </FormField>

              <FormField label="Git repository">
                <Input
                  value={form.gitRepository}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gitRepository: e.target.value,
                    }))
                  }
                  placeholder="https://github.com/org/repo"
                  className="h-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200"
                />
              </FormField>

              <FormField label="Setup instructions">
                <Textarea
                  value={form.setupInstructions}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      setupInstructions: e.target.value,
                    }))
                  }
                  placeholder={"# INSTALL\n- pnpm install\n\n# START\n- pnpm dev"}
                  rows={5}
                  className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200 font-mono text-xs resize-y"
                />
              </FormField>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 mt-8">
              <Button
                onClick={handleCancelForm}
                disabled={saving}
                variant="ghost"
                className="h-9 px-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className={cn(
                  "h-9 px-5 text-sm font-medium rounded-lg transition-all duration-200",
                  form.name.trim()
                    ? "bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-md shadow-[var(--accent-primary)]/20"
                    : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : (
                  <Check className="size-4 mr-1.5" />
                )}
                {saving
                  ? "Saving..."
                  : editingProject
                    ? "Save changes"
                    : "Create project"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
        {label}
        {required && (
          <span className="text-[var(--accent-primary)] ml-0.5">*</span>
        )}
      </label>
      {children}
    </div>
  );
}
