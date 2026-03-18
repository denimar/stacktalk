import { RunnerCallbacks } from "./playwrightRunner";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openrouter/auto";

function extractCodeBlocks(text: string): string[] {
  const regex = /```[\w]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

export async function runOpenRouterAgent(
  prompt: string,
  callbacks: RunnerCallbacks
): Promise<{ response: string; codeBlocks: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured in environment variables");
  }
  callbacks.onLog("Sending prompt to OpenRouter (model: openrouter/auto)...");
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://stacktalk.dev",
        "X-Title": "Stacktalk",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 16000,
      }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
    }
    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content ?? "";
    if (!responseText) {
      throw new Error("OpenRouter returned an empty response");
    }
    const modelUsed = data.model || OPENROUTER_MODEL;
    callbacks.onLog(`OpenRouter response received (model used: ${modelUsed}).`);
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
