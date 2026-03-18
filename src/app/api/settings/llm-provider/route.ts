import { NextRequest, NextResponse } from "next/server";
import { getLlmProvider, setLlmProvider, LlmProvider } from "@/lib/llm-provider";

const VALID_PROVIDERS: LlmProvider[] = ["claude-subscription", "open-router"];

export async function GET() {
  try {
    console.log("[Settings] GET /api/settings/llm-provider — fetching current provider");
    const provider = await getLlmProvider();
    console.log("[Settings] Current LLM provider:", provider);
    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Failed to get LLM provider setting", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { provider } = await request.json();
    console.log("[Settings] PUT /api/settings/llm-provider — requested provider:", provider);
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      console.log("[Settings] Invalid provider rejected:", provider);
      return NextResponse.json(
        { error: "Invalid provider", valid: VALID_PROVIDERS },
        { status: 400 }
      );
    }
    await setLlmProvider(provider);
    console.log("[Settings] LLM provider updated successfully to:", provider);
    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Failed to update LLM provider setting", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
