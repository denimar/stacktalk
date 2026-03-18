"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  FolderOpen,
  Check,
  Settings,
} from "lucide-react";
import { useProjectContext } from "@/contexts/ProjectContext";
import { ProjectManagementModal } from "@/components/ProjectManagementModal";

export function ToolbarProjectSelector() {
  const { projects, selectedProject, selectProject, loading } =
    useProjectContext();
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <div className="size-4 rounded bg-[var(--bg-elevated)] animate-pulse" />
        <div className="h-3.5 w-20 rounded bg-[var(--bg-elevated)] animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150 outline-none cursor-pointer",
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
            open && "bg-[var(--bg-hover)] text-[var(--text-primary)]"
          )}
          aria-label="Select project"
        >
          <FolderOpen className="size-4 shrink-0 text-[var(--accent-primary)]" />
          <span className="text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]">
            {selectedProject?.name ?? "Select project"}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-64 rounded-xl bg-[var(--bg-surface)] p-0 shadow-xl ring-1 ring-[var(--border-medium)] overflow-hidden gap-0"
        >
          {/* Project list */}
          <div className="px-1.5 py-1.5 max-h-[280px] overflow-y-auto">
            {projects.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-[var(--text-muted)]">
                  No projects yet
                </p>
              </div>
            ) : (
              projects.map((project) => {
                const isSelected = project.id === selectedProject?.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      selectProject(project.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-150 cursor-pointer",
                      isSelected
                        ? "bg-[var(--accent-primary)]/8 text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 flex items-center justify-center size-7 rounded-md ring-1 transition-colors duration-150",
                        isSelected
                          ? "bg-[var(--accent-primary)]/12 ring-[var(--accent-primary)]/20"
                          : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)]"
                      )}
                    >
                      <FolderOpen
                        className={cn(
                          "size-3.5",
                          isSelected
                            ? "text-[var(--accent-primary)]"
                            : "text-[var(--text-muted)]"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {project.name}
                      </p>
                      {project.description && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-[var(--accent-primary)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <Separator className="bg-[var(--border-subtle)]" />

          {/* Manage link */}
          <div className="px-1.5 py-1.5">
            <button
              onClick={() => {
                setOpen(false);
                setManageOpen(true);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <span className="text-[var(--text-muted)] shrink-0">
                <Settings className="size-4" />
              </span>
              <span className="font-medium">Manage projects</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <ProjectManagementModal
        open={manageOpen}
        onOpenChange={setManageOpen}
      />
    </>
  );
}
