"use client";

import { useState, useEffect, useCallback } from "react";

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  gitRepository: string;
}

const STORAGE_KEY = "stacktalk_selected_project";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const json = await res.json();
      const fetched = (json.projects ?? []) as ProjectItem[];
      setProjects(fetched);
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedExists = fetched.some((p) => p.id === stored);
      if (storedExists) {
        setSelectedProjectId(stored);
      } else if (fetched.length > 0) {
        setSelectedProjectId(fetched[0].id);
        localStorage.setItem(STORAGE_KEY, fetched[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects", { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const addProject = useCallback(
    async (data: { name: string; description: string; gitRepository: string }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to create project");
      }
      const json = await res.json();
      const created = json.data as ProjectItem;
      setProjects((prev) => [...prev, created]);
      selectProject(created.id);
      return created;
    },
    [selectProject]
  );

  const updateProject = useCallback(
    async (id: string, data: { name: string; description: string; gitRepository: string }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to update project");
      }
      const json = await res.json();
      const updated = json.data as ProjectItem;
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    []
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to delete project");
      }
      setProjects((prev) => {
        const remaining = prev.filter((p) => p.id !== id);
        if (selectedProjectId === id && remaining.length > 0) {
          const newId = remaining[0].id;
          setSelectedProjectId(newId);
          localStorage.setItem(STORAGE_KEY, newId);
        } else if (remaining.length === 0) {
          setSelectedProjectId(null);
          localStorage.removeItem(STORAGE_KEY);
        }
        return remaining;
      });
    },
    [selectedProjectId]
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return {
    projects,
    selectedProject,
    selectedProjectId,
    loading,
    selectProject,
    addProject,
    updateProject,
    deleteProject,
    refresh: fetchProjects,
  };
}
