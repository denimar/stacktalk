import prisma from "@/lib/prisma";
import sseBus from "@/lib/sse-bus";
import { TaskMessageResponse, TaskMessageAuthor } from "@/lib/feed-types";
import { createTask, addAgentToTask } from "@/lib/store";
import { createAgents, executeAgent } from "@/lib/runAgent";
import { getProjectContext } from "@/lib/projectContext";
import { Project } from "@/lib/types";
import { captureWithThemes } from "@/lib/screenshotRunner";
import { cleanupRepo } from "@/lib/git-repo-manager";

interface FeedAgentRunParams {
  dbTaskId: string;
  projectId: string;
  description: string;
  agentDbId: string;
  agentName: string;
  agentAvatar: string | null;
  project: Project;
}

async function createTaskMessage(
  content: string,
  authorType: "user" | "agent",
  authorId: string,
  projectId: string,
  taskId: string,
  author: TaskMessageAuthor
): Promise<TaskMessageResponse> {
  const message = await prisma.taskMessage.create({
    data: {
      content,
      authorType,
      authorId,
      projectId,
      taskId,
      parentMessageId: null,
    },
  });
  const response: TaskMessageResponse = {
    id: message.id,
    content: message.content,
    authorType: message.authorType,
    authorId: message.authorId,
    projectId: message.projectId,
    taskId: message.taskId,
    parentMessageId: null,
    replyCount: 0,
    lastReplyAt: null,
    replyAuthors: [],
    isEdited: false,
    editedAt: null,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    author,
  };
  sseBus.publish({
    type: "message:created",
    payload: response as unknown as Record<string, unknown>,
    projectId,
  });
  return response;
}

interface CaptureFeedScreenshotsParams {
  dbTaskId: string;
  agentId: string;
  projectId: string;
  agentDbId: string;
  agentAuthor: TaskMessageAuthor;
  devUrl?: string;
  filesWritten: string[];
}

function inferRoutesFromFiles(filesWritten: string[]): string[] {
  const routes = new Set<string>();
  let hasComponentFiles = false;
  for (const file of filesWritten) {
    const appMatch = file.match(/src\/app\/(.+?)\/(page|layout)\.(tsx|jsx|ts|js)$/);
    if (appMatch) {
      const routePath = appMatch[1]
        .replace(/\[([^\]]+)\]/g, "")
        .replace(/\(.*?\)\//g, "");
      if (routePath && !routePath.includes("[")) {
        routes.add(`/${routePath}`);
      }
    }
    const isRootPage = /src\/app\/page\.(tsx|jsx|ts|js)$/.test(file);
    if (isRootPage) {
      routes.add("/");
    }
    const isComponent = /src\/(components|contexts|lib)\//.test(file);
    if (isComponent) {
      hasComponentFiles = true;
    }
  }
  if (routes.size === 0) {
    routes.add(hasComponentFiles ? "/tasks" : "/");
  }
  return Array.from(routes);
}

async function captureFeedScreenshots(params: CaptureFeedScreenshotsParams): Promise<void> {
  const { dbTaskId, agentId, projectId, agentDbId, agentAuthor, devUrl, filesWritten } = params;
  if (!devUrl) return;
  const baseUrl = devUrl.replace(/\/$/, "");
  try {
    const routes = inferRoutesFromFiles(filesWritten);
    console.log(`[FeedAgent] Taking themed screenshots for routes: ${routes.join(", ")} at ${baseUrl}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const imageLines: string[] = [];
    for (const route of routes) {
      const safeRoute = route.replace(/\//g, "_").replace(/^_/, "") || "root";
      const baseName = `feed-${dbTaskId}-${agentId}-${safeRoute}.png`;
      const url = route === "/" ? baseUrl : `${baseUrl}${route}`;
      const themed = await captureWithThemes(url, baseName);
      if (themed) {
        imageLines.push(
          `**Dark theme**\n![Dark](/api/screenshots/${themed.dark})`,
          `**Light theme**\n![Light](/api/screenshots/${themed.light})`
        );
      }
    }
    if (imageLines.length > 0) {
      await createTaskMessage(
        `Here's how it looks:\n\n${imageLines.join("\n\n")}`,
        "agent",
        agentDbId,
        projectId,
        dbTaskId,
        agentAuthor
      );
    }
  } catch (error) {
    console.error("Feed screenshot capture failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function runFeedAgent(params: FeedAgentRunParams): Promise<void> {
  const {
    dbTaskId,
    projectId,
    description,
    agentDbId,
    agentName,
    agentAvatar,
    project,
  } = params;
  const agentAuthor: TaskMessageAuthor = {
    id: agentDbId,
    name: agentName,
    avatar: agentAvatar,
    role: "implementer",
  };
  await createTaskMessage(
    "Working on it...",
    "agent",
    agentDbId,
    projectId,
    dbTaskId,
    agentAuthor
  );
  try {
    await prisma.task.update({
      where: { id: dbTaskId },
      data: { status: "in_progress" },
    });
    if (project.gitRepository) {
      await createTaskMessage(
        `Preparing repository: \`${project.gitRepository}\`\nLocal path: \`${project.dir}\``,
        "agent",
        agentDbId,
        projectId,
        dbTaskId,
        agentAuthor
      );
    }
    const inMemoryTask = createTask(description, projectId);
    const agents = createAgents(inMemoryTask.id, 1);
    for (const agent of agents) {
      addAgentToTask(inMemoryTask.id, agent);
    }
    const contextBlock = await getProjectContext(project.dir);
    console.log(
      `[FeedAgent] Loaded ${(contextBlock.length / 1024).toFixed(1)}KB context for "${project.name}"`
    );
    for (const agent of agents) {
      await executeAgent(
        inMemoryTask.id,
        agent,
        description,
        contextBlock,
        project
      );
      if (agent.status === "completed") {
        const filesWritten = agent.logs
          .filter((l) => l.message.startsWith("Wrote:"))
          .map((l) => l.message.replace("Wrote: ", ""));
        let completionMsg = "Task completed successfully.";
        if (filesWritten.length > 0) {
          completionMsg = `Done! I've updated **${filesWritten.length}** file${filesWritten.length === 1 ? "" : "s"}:\n${filesWritten.map((f) => `- \`${f}\``).join("\n")}`;
        }
        await createTaskMessage(
          completionMsg,
          "agent",
          agentDbId,
          projectId,
          dbTaskId,
          agentAuthor
        );
        await captureFeedScreenshots({
          dbTaskId,
          agentId: agent.id,
          projectId,
          agentDbId,
          agentAuthor,
          devUrl: project.devUrl,
          filesWritten,
        });
        await prisma.task.update({
          where: { id: dbTaskId },
          data: { status: "done" },
        });
      } else if (agent.status === "error") {
        await createTaskMessage(
          `Something went wrong: ${agent.error ?? "Unknown error"}`,
          "agent",
          agentDbId,
          projectId,
          dbTaskId,
          agentAuthor
        );
        await prisma.task.update({
          where: { id: dbTaskId },
          data: { status: "todo" },
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Feed agent execution failed", { error: message });
    await createTaskMessage(
      `Something went wrong: ${message}`,
      "agent",
      agentDbId,
      projectId,
      dbTaskId,
      agentAuthor
    );
    await prisma.task.update({
      where: { id: dbTaskId },
      data: { status: "todo" },
    });
  } finally {
    if (project.gitRepository) {
      cleanupRepo(project.gitRepository);
    }
  }
}
