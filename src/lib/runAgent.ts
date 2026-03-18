import { Agent, AgentScreenshots, Project } from "./types";
import { appendAgentLog, updateAgent } from "./store";
import { runLlmAgent } from "./llm-provider";
import { getProjectContext } from "./projectContext";
import { parseFilesFromResponse, writeFilesToProject } from "./fileWriter";
import { takeScreenshot, takeAfterScreenshot, captureWithThemes } from "./screenshotRunner";

const OUTPUT_INSTRUCTIONS = `

CRITICAL OUTPUT FORMAT — YOU MUST FOLLOW THIS EXACTLY:

For EVERY code block you output, you MUST include the file path in TWO places:
1. As a bold header ABOVE the code block
2. As a special comment on the VERY FIRST LINE inside the code block

Example (follow this format exactly):

**\`src/components/MyComponent.tsx\`**
\`\`\`tsx
// @file: src/components/MyComponent.tsx
"use client";
import React from "react";
// ... rest of the full file contents
\`\`\`

**\`src/app/globals.css\`**
\`\`\`css
/* @file: src/app/globals.css */
:root {
  --background: #ffffff;
}
\`\`\`

RULES:
- The first line of EVERY code block MUST be a comment with "// @file: <path>" (or "/* @file: <path> */" for CSS)
- Output the COMPLETE file contents, not snippets
- Do NOT skip any files — output ALL files that need to change`;

const AGENT_ROLES = [
  {
    name: "claude-subscription-implementer-agent",
    prefix: `IMPORTANT: Do NOT ask any clarifying questions. Do NOT ask for more details. You have the full project context below — use it. Produce your full output immediately.

You are an expert full-stack software engineer. Your job is to deliver a complete, production-ready implementation for the feature described below.

Follow this process:
1. **Analyze** — Study the project context to understand the existing codebase, tech stack, architecture, patterns, naming conventions, and code style.
2. **Plan** — Mentally design the solution: identify which files to create or modify, the component/module hierarchy, data flow, types, and any edge cases or security considerations.
3. **Implement** — Output complete, working code for EVERY file needed. Match the existing code style exactly. Include all imports, types, exports, and error handling. Do NOT leave placeholders, TODOs, or incomplete sections.
4. **Verify** — Before finishing, review your own output for: correctness, edge cases, security issues (XSS, injection, etc.), performance concerns, proper TypeScript types, and consistency with the existing codebase.

Guidelines:
- Write production-quality code — clean, well-structured, and maintainable.
- Handle edge cases and error states properly.
- Use existing utilities, components, and patterns from the project rather than reinventing.
- Ensure all files are complete — never output partial files or snippets.
- If the feature requires multiple files, output ALL of them.

Feature to implement: `,
  },
];

export function createAgents(taskId: string, count: number = 1): Agent[] {
  const agents: Agent[] = [];
  for (let i = 0; i < Math.min(count, AGENT_ROLES.length); i++) {
    const role = AGENT_ROLES[i];
    agents.push({
      id: crypto.randomUUID(),
      name: role.name,
      status: "idle",
      logs: [],
      output: null,
      codeBlocks: [],
      screenshots: null,
      error: null,
    });
  }
  return agents;
}

export async function executeAgent(
  taskId: string,
  agent: Agent,
  taskDescription: string,
  contextBlock: string,
  project: Project
): Promise<void> {
  const role = AGENT_ROLES.find((r) => r.name === agent.name);
  const prompt =
    OUTPUT_INSTRUCTIONS +
    "\n\n" +
    (role?.prefix || "") +
    taskDescription +
    "\n\n" +
    contextBlock +
    "\n\nREMINDER: Every code block MUST have '// @file: <path>' as the VERY FIRST LINE. Output COMPLETE file contents, not snippets.";

  updateAgent(taskId, agent.id, { status: "running" });
  appendAgentLog(taskId, agent.id, `Agent "${agent.name}" starting...`);

  try {
    const { response, codeBlocks } = await runLlmAgent(prompt, {
      onLog: (message) => {
        appendAgentLog(taskId, agent.id, message);
      },
      onComplete: (resp) => {
        updateAgent(taskId, agent.id, {
          output: resp,
          codeBlocks: extractCodeBlocks(resp),
        });
      },
      onError: (error) => {
        updateAgent(taskId, agent.id, {
          status: "error",
          error,
        });
      },
    });

    // Update output and code blocks but keep status as "running"
    // until file writing and screenshots are done
    updateAgent(taskId, agent.id, {
      output: response,
      codeBlocks,
    });

    // Auto-apply files from agent response
    console.log(`[${agent.name}] Response preview (first 500 chars):\n${response.slice(0, 500)}`);
    appendAgentLog(taskId, agent.id, "Parsing files from response...");
    const parsedFiles = parseFilesFromResponse(response);
    let agentScreenshots: AgentScreenshots | null = null;

    if (parsedFiles.length > 0) {
      appendAgentLog(
        taskId,
        agent.id,
        `Found ${parsedFiles.length} file(s): ${parsedFiles.map((f) => f.filePath).join(", ")}`
      );

      // Take BEFORE screenshot (before writing files)
      let beforeFile: string | null = null;
      if (project.devUrl) {
        appendAgentLog(taskId, agent.id, "Taking BEFORE screenshot...");
        const beforeName = `${taskId}-${agent.id}-before.png`;
        beforeFile = await takeScreenshot(project.devUrl, beforeName);
        if (beforeFile) {
          appendAgentLog(taskId, agent.id, "Before screenshot captured.");
        } else {
          appendAgentLog(taskId, agent.id, `Before screenshot failed (${project.devUrl} unreachable?)`);
        }
      }

      const result = await writeFilesToProject(project.dir, parsedFiles);

      for (const file of result.written) {
        appendAgentLog(taskId, agent.id, `Wrote: ${file}`);
      }
      for (const err of result.errors) {
        appendAgentLog(taskId, agent.id, `Failed to write ${err.file}: ${err.error}`);
      }
      appendAgentLog(
        taskId,
        agent.id,
        `Applied ${result.written.length} file(s) to ${project.dir}`
      );

      // Take AFTER screenshot with retry until page changes
      if (project.devUrl && result.written.length > 0 && beforeFile) {
        appendAgentLog(taskId, agent.id, "Waiting for dev server recompilation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const afterName = `${taskId}-${agent.id}-after.png`;
        const afterFile = await takeAfterScreenshot(
          project.devUrl,
          afterName,
          beforeFile,
          (message) => appendAgentLog(taskId, agent.id, message)
        );
        if (afterFile) {
          agentScreenshots = { before: beforeFile, after: afterFile };
          appendAgentLog(taskId, agent.id, "After screenshot captured.");
        } else {
          appendAgentLog(taskId, agent.id, "After screenshot failed.");
        }
        // Capture dark + light themed screenshots
        appendAgentLog(taskId, agent.id, "Taking dark/light themed screenshots...");
        const themedName = `${taskId}-${agent.id}-themed.png`;
        const themed = await captureWithThemes(
          project.devUrl,
          themedName,
          (message) => appendAgentLog(taskId, agent.id, message)
        );
        if (themed && agentScreenshots) {
          agentScreenshots.darkAfter = themed.dark;
          agentScreenshots.lightAfter = themed.light;
          appendAgentLog(taskId, agent.id, "Dark/light themed screenshots captured.");
        }
      }
    } else {
      appendAgentLog(taskId, agent.id, "No files with path headers found to apply.");
    }

    appendAgentLog(taskId, agent.id, "Agent completed successfully.");

    // Set status to "completed" AFTER screenshots are done
    // so the frontend keeps polling until everything is ready
    updateAgent(taskId, agent.id, {
      status: "completed",
      screenshots: agentScreenshots,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    updateAgent(taskId, agent.id, {
      status: "error",
      error: message,
    });
    appendAgentLog(taskId, agent.id, `Agent failed: ${message}`);
  }
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

export async function runAllAgents(
  taskId: string,
  agents: Agent[],
  taskDescription: string,
  project: Project
): Promise<void> {
  // Load project context once for all agents
  const contextBlock = await getProjectContext(project.dir);
  console.log(
    `[Context] Loaded ${(contextBlock.length / 1024).toFixed(1)}KB of project context for "${project.name}"`
  );

  await Promise.all(
    agents.map((agent) =>
      executeAgent(taskId, agent, taskDescription, contextBlock, project)
    )
  );
}
