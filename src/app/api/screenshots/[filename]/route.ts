import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getScreenshotPath } from "@/lib/screenshotRunner";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
): Promise<NextResponse> {
  const { filename } = await params;
  const filePath = getScreenshotPath(filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Screenshot not found" }, { status: 404 });
  }
  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache",
    },
  });
}
