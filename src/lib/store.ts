import { Task, Agent } from "./types";

// Persist across HMR restarts using globalThis (standard Next.js pattern)
const globalForStore = globalThis as unknown as {
  __runnerTasks: Map<string, Task>;
};
if (!globalForStore.__runnerTasks) {
  globalForStore.__runnerTasks = new Map<string, Task>();
}
const tasks = globalForStore.__runnerTasks;

export function createTask(description: string, projectId: string): Task {
  const id = crypto.randomUUID();
  const task: Task = {
    id,
    description,
    projectId,
    agents: [],
    createdAt: Date.now(),
  };
  tasks.set(id, task);
  return task;
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function getAllTasks(): Task[] {
  return Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getTasksByProject(projectId: string): Task[] {
  return Array.from(tasks.values())
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function addAgentToTask(taskId: string, agent: Agent): void {
  const task = tasks.get(taskId);
  if (task) {
    task.agents.push(agent);
  }
}

export function updateAgent(
  taskId: string,
  agentId: string,
  updates: Partial<Agent>
): void {
  const task = tasks.get(taskId);
  if (!task) return;
  const agent = task.agents.find((a) => a.id === agentId);
  if (agent) {
    Object.assign(agent, updates);
  }
}

export function appendAgentLog(
  taskId: string,
  agentId: string,
  message: string
): void {
  const task = tasks.get(taskId);
  if (!task) return;
  const agent = task.agents.find((a) => a.id === agentId);
  if (agent) {
    agent.logs.push({ timestamp: Date.now(), message });
  }
}
