import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const { id } = await params;
    const body = await request.json();
    const { name, description, gitRepository } = body as {
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
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.deletedAt) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name.trim(),
        description: typeof description === "string" ? description.trim() : project.description,
        gitRepository: typeof gitRepository === "string" ? gitRepository.trim() : project.gitRepository,
      },
      select: { id: true, name: true, description: true, gitRepository: true },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update project", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.deletedAt) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
