import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskType } from "@/generated/prisma/client";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";
import sseBus from "@/lib/sse-bus";
import { TaskMessageResponse, TaskMessageAuthor } from "@/lib/feed-types";
import { runFeedAgent } from "@/lib/feed-agent-runner";
import { PROJECTS } from "@/lib/types";
import { prepareProjectRepo } from "@/lib/git-repo-manager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const { id: projectId } = await params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { taskMessages: true },
        },
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
    const data = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      messageCount: task._count.taskMessages,
      createdBy: task.createdBy ? { id: task.createdBy.id, name: task.createdBy.name, avatar: task.createdBy.avatar } : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to fetch project tasks", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const VALID_TYPES: Set<string> = new Set(["bug", "feature", "task"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const { id: projectId } = await params;
    const body = await request.json();
    const { title, type = "task", description = "" } = body as { title?: string; type?: string; description?: string };
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }
    if (!VALID_TYPES.has(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: bug, feature, or task" },
        { status: 400 }
      );
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    const defaultAgent = await prisma.agent.findFirst({
      orderBy: { kanbanOrder: "asc" },
    });
    if (!defaultAgent) {
      return NextResponse.json(
        { error: "No agents available to assign" },
        { status: 422 }
      );
    }
    const trimmedDescription = typeof description === "string" ? description.trim() : "";
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: trimmedDescription,
        type: type as TaskType,
        status: "in_progress",
        projectId,
        assigneeId: defaultAgent.id,
        createdById: authResult.id,
      },
    });
    if (trimmedDescription) {
      const userAuthor: TaskMessageAuthor = {
        id: authResult.id,
        name: authResult.name,
        avatar: authResult.avatar,
        role: authResult.role,
      };
      const userMessage = await prisma.taskMessage.create({
        data: {
          content: trimmedDescription,
          authorType: "user",
          authorId: authResult.id,
          projectId,
          taskId: task.id,
          parentMessageId: null,
        },
      });
      const userMsgResponse: TaskMessageResponse = {
        id: userMessage.id,
        content: userMessage.content,
        authorType: userMessage.authorType,
        authorId: userMessage.authorId,
        projectId: userMessage.projectId,
        taskId: userMessage.taskId,
        parentMessageId: null,
        replyCount: 0,
        lastReplyAt: null,
        replyAuthors: [],
        isEdited: false,
        editedAt: null,
        createdAt: userMessage.createdAt.toISOString(),
        updatedAt: userMessage.updatedAt.toISOString(),
        author: userAuthor,
      };
      sseBus.publish({
        type: "message:created",
        payload: userMsgResponse as unknown as Record<string, unknown>,
        projectId,
      });
    }
    const knownProject = PROJECTS.find(
      (p) => p.name.toLowerCase() === project.name.toLowerCase()
    );
    const resolveAndRunAgent = async () => {
      let dir = knownProject?.dir ?? "";
      let resolvedDevUrl = (project.devUrl && project.devUrl.trim()) ? project.devUrl.trim() : knownProject?.devUrl;
      if (project.gitRepository) {
        try {
          const prepared = await prepareProjectRepo(project.gitRepository);
          dir = prepared.dir;
          resolvedDevUrl = prepared.devUrl;
          console.log(`[Tasks] Resolved git repo to dir: ${dir}, devUrl: ${resolvedDevUrl}`);
        } catch (repoError) {
          console.error("Failed to prepare git repository", {
            gitRepository: project.gitRepository,
            error: repoError instanceof Error ? repoError.message : String(repoError),
          });
        }
      }
      const agentProject = {
        id: project.id,
        name: project.name,
        dir,
        gitRepository: project.gitRepository || undefined,
        devUrl: resolvedDevUrl,
      };
      await runFeedAgent({
        dbTaskId: task.id,
        projectId,
        description: trimmedDescription || title.trim(),
        agentDbId: defaultAgent.id,
        agentName: defaultAgent.name,
        agentAvatar: defaultAgent.avatar,
        project: agentProject,
      });
    };
    resolveAndRunAgent().catch((err) => {
      console.error("Feed agent execution error", { error: err });
    });
    return NextResponse.json({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        messageCount: trimmedDescription ? 1 : 0,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create task", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
