import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const userProjects = await prisma.userProject.findMany({
      where: { userId: authResult.id },
      include: {
        project: {
          select: { id: true, name: true, description: true, gitRepository: true, deletedAt: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    let projects = userProjects
      .map((up) => up.project)
      .filter((p) => !p.deletedAt)
      .map(({ deletedAt: _, ...p }) => p);
    if (projects.length === 0) {
      const allProjects = await prisma.project.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, description: true, gitRepository: true },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
      projects = allProjects;
    }
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const body = await request.json();
    const { name, description = "", gitRepository = "" } = body as {
      name?: string;
      description?: string;
      gitRepository?: string;
    };
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description.trim() : "",
        gitRepository: typeof gitRepository === "string" ? gitRepository.trim() : "",
      },
      select: { id: true, name: true, description: true, gitRepository: true },
    });
    await prisma.userProject.create({
      data: {
        userId: authResult.id,
        projectId: project.id,
      },
    });
    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Failed to create project", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
