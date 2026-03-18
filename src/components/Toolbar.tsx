"use client";

import { ProjectSelector } from "@/components/ProjectSelector";
import { TaskInput } from "@/components/TaskInput";

interface ToolbarProps {
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  onSubmit: (description: string) => void;
  isLoading: boolean;
}

export function Toolbar({
  selectedProject,
  onProjectChange,
  onSubmit,
  isLoading,
}: ToolbarProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <ProjectSelector
          value={selectedProject}
          onChange={onProjectChange}
          disabled={isLoading}
        />
        <div className="flex-1 w-full sm:w-auto">
          <TaskInput onSubmit={onSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
