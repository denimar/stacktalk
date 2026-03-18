import { NextResponse } from "next/server";
import { sessionExists } from "@/lib/playwrightRunner";

export async function GET() {
  return NextResponse.json({ exists: sessionExists() });
}
