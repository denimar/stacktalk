import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAuthError } from "@/lib/feed-auth";
import { uploadToS3 } from "@/lib/s3";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const BLOCKED_EXTENSIONS = new Set(["exe", "bat", "cmd", "scr", "msi", "dll", "com", "pif"]);

function getExtensionFromFile(file: File): string {
  const nameExt = file.name.split(".").pop()?.toLowerCase();
  if (nameExt && nameExt.length <= 10) return nameExt;
  const mimeMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/json": "json",
    "text/plain": "txt",
    "text/csv": "csv",
    "text/html": "html",
    "text/css": "css",
    "text/javascript": "js",
    "application/javascript": "js",
    "application/typescript": "ts",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/msword": "doc",
    "application/vnd.ms-excel": "xls",
    "application/vnd.ms-powerpoint": "ppt",
  };
  return mimeMap[file.type] ?? "bin";
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) return authResult;
    const formData = await request.formData();
    const file = formData.get("file");
    const taskId = formData.get("taskId") as string | null;
    const messageId = formData.get("messageId") as string | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing required field", required: ["file"] },
        { status: 400 }
      );
    }
    if (!taskId) {
      return NextResponse.json(
        { error: "Missing required field", required: ["taskId"] },
        { status: 400 }
      );
    }
    if (!messageId) {
      return NextResponse.json(
        { error: "Missing required field", required: ["messageId"] },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large", maxSize: "25MB" },
        { status: 400 }
      );
    }
    const ext = getExtensionFromFile(file);
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "File type not allowed", extension: ext },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name);
    const uniqueFileName = `${randomUUID()}-${safeName}`;
    const { s3Key } = await uploadToS3({
      buffer,
      taskId,
      messageId,
      fileName: uniqueFileName,
      contentType: file.type || "application/octet-stream",
    });
    const stableUrl = `/api/feed/attachment?key=${encodeURIComponent(s3Key)}`;
    return NextResponse.json({
      url: stableUrl,
      s3Key,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Failed to upload file to S3", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
