"use client";

import { createContext, useContext } from "react";
import { useProjects, type ProjectItem } from "@/hooks/useProjects";

interface ProjectContextType {
  projects: ProjectItem[];
  selectedProject: ProjectItem | null;
  selectedProjectId: string | null;
  loading: boolean;
  selectProject: (id: string) => void;
  addProject: (data: { name: string; description: string; gitRepository: string; setupInstructions: string }) => Promise<ProjectItem>;
  updateProject: (id: string, data: { name: string; description: string; gitRepository: string; setupInstructions: string }) => Promise<ProjectItem>;
  deleteProject: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const value = useProjects();
  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within ProjectProvider");
  }
  return context;
}
