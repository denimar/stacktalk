import { RunnerCallbacks } from "./playwrightRunner";
import { frontendDeveloperAgent } from "@/mastra/agents/frontend-developer-agent";
import { backendDeveloperAgent } from "@/mastra/agents/backend-developer-agent";
import { productManagerAgent } from "@/mastra/agents/product-manager-agent";
import { projectManagerAgent } from "@/mastra/agents/project-manager-agent";
import { techLeadAgent } from "@/mastra/agents/tech-lead-agent";
import { productDesignerAgent } from "@/mastra/agents/product-designer-agent";
import { qaEngineerAgent } from "@/mastra/agents/qa-engineer-agent";
import { securityAnalystAgent } from "@/mastra/agents/security-analyst-agent";
import { technicalWriterAgent } from "@/mastra/agents/technical-writer-agent";
import { simpleRequestResolverAgent } from "@/mastra/agents/simple-request-resolver-agent";

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

const agentRegistry: Record<MastraAgentId, { generate: (messages: string) => Promise<{ text: string }> }> = {
  "frontend-developer": frontendDeveloperAgent,
  "backend-developer": backendDeveloperAgent,
  "product-manager": productManagerAgent,
  "project-manager": projectManagerAgent,
  "tech-lead": techLeadAgent,
  "product-designer": productDesignerAgent,
  "qa-engineer": qaEngineerAgent,
  "security-analyst": securityAnalystAgent,
  "technical-writer": technicalWriterAgent,
  "simple-request-resolver": simpleRequestResolverAgent,
};

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
  const agent = agentRegistry[agentId];
  if (!agent) {
    throw new Error(`Unknown Mastra agent: ${agentId}`);
  }
  callbacks.onLog(`Sending prompt to Mastra agent "${agentId}"...`);
  try {
    const result = await agent.generate(prompt);
    const responseText = result.text;
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
