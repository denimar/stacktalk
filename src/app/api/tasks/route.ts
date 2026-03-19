import { NextRequest, NextResponse } from "next/server";
import { createTask, getAllTasks, getTasksByProject, addAgentToTask } from "@/lib/store";
import { createAgents, runAllAgents } from "@/lib/runAgent";
import prisma from "@/lib/prisma";
import { prepareProjectRepo } from "@/lib/git-repo-manager";
import { PROJECTS } from "@/lib/types";
import { isCodespacesEnabled } from "@/lib/codespaces-deployer";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (projectId) {
    return NextResponse.json(getTasksByProject(projectId));
  }
  return NextResponse.json(getAllTasks());
}

export async function POST(request: NextRequest) {
  const { description, agentCount = 1, projectId } = await request.json();

  if (!description || typeof description !== "string") {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json(
      { error: "Project is required" },
      { status: 400 }
    );
  }

  const dbProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, gitRepository: true, deletedAt: true },
  });

  if (!dbProject || dbProject.deletedAt) {
    return NextResponse.json(
      { error: "Invalid project selected" },
      { status: 400 }
    );
  }

  const knownProject = PROJECTS.find(
    (p) => p.name.toLowerCase() === dbProject.name.toLowerCase()
  );
  let dir = knownProject?.dir ?? "";
  let devUrl = knownProject?.devUrl;
  if (dbProject.gitRepository) {
    try {
      const prepared = await prepareProjectRepo(dbProject.gitRepository);
      dir = prepared.dir;
      devUrl = prepared.devUrl;
      console.log(`[Tasks] Resolved git repo to dir: ${dir}, devUrl: ${devUrl}`);
    } catch (repoError) {
      console.error("Failed to prepare git repository", {
        gitRepository: dbProject.gitRepository,
        error: repoError instanceof Error ? repoError.message : String(repoError),
      });
    }
  }
  const useCodespaces = isCodespacesEnabled() && !!dbProject.gitRepository;
  const project = {
    id: dbProject.id,
    name: dbProject.name,
    dir,
    gitRepository: dbProject.gitRepository || undefined,
    devUrl,
    useCodespaces,
  };

  const task = createTask(description, projectId);
  const agents = createAgents(task.id, agentCount);

  for (const agent of agents) {
    addAgentToTask(task.id, agent);
  }

  runAllAgents(task.id, agents, description, project).catch((err) => {
    console.error("Agent execution error:", err);
  });

  return NextResponse.json(task, { status: 201 });
}
