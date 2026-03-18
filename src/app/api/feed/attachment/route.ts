import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const s3Key = request.nextUrl.searchParams.get("key");
    if (!s3Key) {
      return NextResponse.json(
        { error: "Missing required parameter", required: ["key"] },
        { status: 400 }
      );
    }
    const { body, contentType, contentLength } = await getObject(s3Key);
    if (!body) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    const byteArray = await body.transformToByteArray();
    const buffer = Buffer.from(byteArray);
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (contentLength) headers["Content-Length"] = String(contentLength);
    headers["Cache-Control"] = "private, max-age=3600";
    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    console.error("Failed to fetch attachment from S3", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
