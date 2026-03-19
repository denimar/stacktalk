import { describe, it, expect } from "@jest/globals";
import { agents, DEFAULT_PROJECT_NAME, projects, tasks } from "./seed-data";

const expectedColors: Record<string, string> = {
  "Product Manager": "#6366F1",
  "Project Manager": "#F59E0B",
  "Tech Lead": "#10B981",
  "Product Designer": "#EC4899",
  "Frontend Developer": "#0EA5E9",
  "Backend Developer": "#8B5CF6",
  "QA Engineer": "#F97316",
  "Security Analyst": "#EF4444",
  "Technical Writer": "#14B8A6",
};

describe("Seed agents data", () => {
  it("should contain exactly 9 agents", () => {
    expect(agents).toHaveLength(9);
  });

  it("should have unique roles for all agents", () => {
    const roles = agents.map((a) => a.role);
    const uniqueRoles = new Set(roles);
    expect(uniqueRoles.size).toBe(9);
  });

  it("should have unique kanbanOrder values for all agents", () => {
    const orders = agents.map((a) => a.kanbanOrder);
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBe(9);
  });

  it("should have correct color for each agent matching the PRD", () => {
    for (const agent of agents) {
      expect(agent.color).toBe(expectedColors[agent.role]);
    }
  });

  it("should contain all expected role names", () => {
    const roles = agents.map((a) => a.role).sort();
    const expected = [
      "Backend Developer",
      "Frontend Developer",
      "Product Designer",
      "Product Manager",
      "Project Manager",
      "QA Engineer",
      "Security Analyst",
      "Tech Lead",
      "Technical Writer",
    ];
    expect(roles).toEqual(expected);
  });

  it("should have valid hex color format for all agents", () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const agent of agents) {
      expect(agent.color).toMatch(hexColorRegex);
    }
  });

  it("should have non-empty name and avatar for all agents", () => {
    for (const agent of agents) {
      expect(agent.name.length).toBeGreaterThan(0);
      expect(agent.avatar.length).toBeGreaterThan(0);
    }
  });
});

describe("Seed projects data", () => {
  it("should contain exactly 5 projects", () => {
    expect(projects).toHaveLength(5);
  });

  it("should have unique names for all projects", () => {
    const names = projects.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(5);
  });

  it("should contain all expected project names matching the design", () => {
    const names = projects.map((p) => p.name).sort();
    const expected = [
      "DevOps Pipeline",
      "E-Commerce API",
      "Marketing Site",
      "StackTalk Platform",
      "Pipelord Platform",
    ];
    expect(names).toEqual(expected);
  });

  it("should have the default project name as the first project", () => {
    expect(projects[0].name).toBe(DEFAULT_PROJECT_NAME);
  });

  it("should have non-empty gitRepository for all projects", () => {
    for (const project of projects) {
      expect(project.gitRepository.length).toBeGreaterThan(0);
    }
  });

  it("should have non-empty description for all projects", () => {
    for (const project of projects) {
      expect(project.description.length).toBeGreaterThan(0);
    }
  });

  it("should have correct data for each project matching the design", () => {
    const pipelord = projects.find((p) => p.name === "Pipelord Platform");
    expect(pipelord?.gitRepository).toBe("github.com/pipelord/platform");
    expect(pipelord?.description).toBe("AI agent orchestration and task management");
    const ecommerce = projects.find((p) => p.name === "E-Commerce API");
    expect(ecommerce?.gitRepository).toBe("github.com/pipelord/ecommerce");
    expect(ecommerce?.description).toBe("RESTful API for online marketplace");
    const marketing = projects.find((p) => p.name === "Marketing Site");
    expect(marketing?.gitRepository).toBe("github.com/pipelord/marketing");
    expect(marketing?.description).toBe("Company marketing website redesign");
    const stacktalk = projects.find((p) => p.name === "StackTalk Platform");
    expect(stacktalk?.gitRepository).toBe("git@github.com:denimar/stacktalk.git");
    expect(stacktalk?.description).toBe("Conversational webapp builder powered by AI agents");
    const devops = projects.find((p) => p.name === "DevOps Pipeline");
    expect(devops?.gitRepository).toBe("github.com/pipelord/devops");
    expect(devops?.description).toBe("CI/CD automation and infrastructure");
  });
});

describe("Seed tasks data", () => {
  it("should have unique titles for all tasks", () => {
    const titles = tasks.map((t) => t.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(tasks.length);
  });

  it("should only assign tasks to valid roles", () => {
    const roleNames = new Set(agents.map((a) => a.role));
    for (const task of tasks) {
      expect(roleNames.has(task.assigneeRole)).toBe(true);
    }
  });

  it("should have non-empty description for all tasks", () => {
    for (const task of tasks) {
      expect(task.description.length).toBeGreaterThan(0);
    }
  });

  it("should contain all three task types", () => {
    const types = new Set(tasks.map((t) => t.type));
    expect(types).toContain("bug");
    expect(types).toContain("feature");
    expect(types).toContain("task");
  });

  it("should contain all five statuses", () => {
    const statuses = new Set(tasks.map((t) => t.status));
    expect(statuses).toContain("todo");
    expect(statuses).toContain("waiting_approval");
    expect(statuses).toContain("in_progress");
    expect(statuses).toContain("qa");
    expect(statuses).toContain("done");
  });
});
