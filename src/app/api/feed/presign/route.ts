import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";
import { getPresignedUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const body = await request.json();
    const s3Key = body.s3Key as string | undefined;
    if (!s3Key) {
      return NextResponse.json(
        { error: "Missing required field", required: ["s3Key"] },
        { status: 400 }
      );
    }
    const url = await getPresignedUrl(s3Key);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to generate presigned URL", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
