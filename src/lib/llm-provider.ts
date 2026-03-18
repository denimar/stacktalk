import prisma from "@/lib/prisma";
import { RunnerCallbacks } from "./playwrightRunner";
import { runPlaywrightAgent } from "./playwrightRunner";
import { runOpenRouterAgent } from "./openRouterRunner";

export type LlmProvider = "claude-subscription" | "open-router";

const SETTING_KEY = "llm_provider";
const DEFAULT_PROVIDER: LlmProvider = "claude-subscription";

export async function getLlmProvider(): Promise<LlmProvider> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (setting && (setting.value === "claude-subscription" || setting.value === "open-router")) {
      console.log("[LLM Provider] Resolved provider from DB:", setting.value);
      return setting.value as LlmProvider;
    }
    console.log("[LLM Provider] No provider in DB, using default:", DEFAULT_PROVIDER);
  } catch (error) {
    console.error("Failed to read LLM provider setting", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return DEFAULT_PROVIDER;
}

export async function setLlmProvider(provider: LlmProvider): Promise<void> {
  console.log("[LLM Provider] Persisting provider to DB:", provider);
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: provider },
    create: { key: SETTING_KEY, value: provider },
  });
  console.log("[LLM Provider] Provider saved successfully:", provider);
}

export async function runLlmAgent(
  prompt: string,
  callbacks: RunnerCallbacks
): Promise<{ response: string; codeBlocks: string[] }> {
  const provider = await getLlmProvider();
  console.log("[LLM Provider] Running agent with provider:", provider);
  if (provider === "open-router") {
    return runOpenRouterAgent(prompt, callbacks);
  }
  return runPlaywrightAgent(prompt, callbacks);
}
