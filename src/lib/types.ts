export interface Project {
  id: string;
  name: string;
  dir: string;
  gitRepository?: string;
  devUrl?: string;
  useCodespaces?: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: "stacktalk",
    name: "stacktalk",
    dir: "/home/denimar/projects/personal/stacktalk",
    devUrl: "http://localhost:3000",
  },
  {
    id: "encore-web",
    name: "encore-web",
    dir: "/home/denimar/projects/encore-web",
    devUrl: "http://localhost:3001",
  },
];

export type AgentStatus = "idle" | "running" | "completed" | "error";

export interface AgentLog {
  timestamp: number;
  message: string;
}

export interface AgentScreenshots {
  before: string;
  after: string;
  darkAfter?: string;
  lightAfter?: string;
}

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  logs: AgentLog[];
  output: string | null;
  codeBlocks: string[];
  screenshots: AgentScreenshots | null;
  previewUrl: string | null;
  error: string | null;
}

export interface Task {
  id: string;
  description: string;
  projectId: string;
  agents: Agent[];
  createdAt: number;
}
