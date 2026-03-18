import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { name, email, avatar } = body;
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    const existingUser = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 422 }
      );
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, avatar: avatar ?? undefined },
      select: { id: true, name: true, email: true, avatar: true, role: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to update profile", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
