import { RunnerCallbacks } from "./playwrightRunner";

type MastraAgentId =
  | "frontend-developer"
  | "backend-developer"
  | "product-manager"
  | "project-manager"
  | "tech-lead"
  | "product-designer"
  | "qa-engineer"
  | "security-analyst"
  | "technical-writer"
  | "simple-request-resolver";

function getMastraConfig() {
  const baseUrl = process.env.MASTRA_BASE_URL;
  if (!baseUrl) {
    throw new Error("MASTRA_BASE_URL is not configured in environment variables");
  }
  const apiKey = process.env.MASTRA_API_KEY;
  if (!apiKey) {
    throw new Error("MASTRA_API_KEY is not configured in environment variables");
  }
  return { baseUrl, apiKey };
}

function extractCodeBlocks(text: string): string[] {
  const regex = /```[\w]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

export async function runMastraAgent(
  prompt: string,
  callbacks: RunnerCallbacks,
  agentId: MastraAgentId = "frontend-developer"
): Promise<{ response: string; codeBlocks: string[] }> {
  const { baseUrl, apiKey } = getMastraConfig();
  const url = `${baseUrl}/agents/${agentId}/generate`;
  callbacks.onLog(`Sending prompt to Mastra agent "${agentId}" at ${baseUrl}...`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Mastra API error (${response.status}): ${errorBody}`);
    }
    const data = await response.json();
    const responseText = data.text ?? "";
    if (!responseText) {
      throw new Error(`Mastra agent "${agentId}" returned an empty response`);
    }
    callbacks.onLog(`Mastra agent "${agentId}" response received.`);
    const codeBlocks = extractCodeBlocks(responseText);
    callbacks.onLog(`Extracted ${codeBlocks.length} code block(s).`);
    callbacks.onComplete(responseText);
    return { response: responseText, codeBlocks };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    callbacks.onError(message);
    throw error;
  }
}

export type { MastraAgentId };
