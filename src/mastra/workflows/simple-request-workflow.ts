import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const simpleRequestInputSchema = z.object({
  taskId: z.string(),
  phase: z.enum(["direct-assignment", "direct-execution"]),
  createdByName: z.string().optional().default(""),
});

const stepResultSchema = z.object({
  taskId: z.string(),
  phase: z.string(),
  status: z.string(),
  createdByName: z.string().optional().default(""),
});

const directAssignmentStep = createStep({
  id: "direct-assignment",
  inputSchema: simpleRequestInputSchema,
  outputSchema: stepResultSchema,
  execute: async ({ inputData }) => {
    const { taskId, createdByName } = inputData;
    console.log(`  🔄 [WORKFLOW] Executing direct-assignment | task: ${taskId}`);
    const { handleDirectAssignment } = await import("@/lib/pipeline");
    const result = await handleDirectAssignment(taskId);
    console.log(`  ${result === "completed" ? "✅" : "❌"} [WORKFLOW] direct-assignment ${result} | task: ${taskId}`);
    return { taskId, phase: "direct-assignment", status: result, createdByName: createdByName ?? "" };
  },
});

const directExecutionStep = createStep({
  id: "direct-execution",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  execute: async ({ inputData }) => {
    const { taskId, createdByName } = inputData;
    console.log(`  🔄 [WORKFLOW] Executing direct-execution | task: ${taskId}`);
    const { handleDirectExecution } = await import("@/lib/pipeline");
    const result = await handleDirectExecution(taskId, createdByName);
    console.log(`  ${result === "completed" ? "✅" : "❌"} [WORKFLOW] direct-execution ${result} | task: ${taskId}`);
    return { taskId, phase: "direct-execution", status: result, createdByName: createdByName ?? "" };
  },
});

export const simpleRequestWorkflow = createWorkflow({
  id: "simple-request-workflow",
  inputSchema: simpleRequestInputSchema,
  outputSchema: stepResultSchema,
})
  .then(directAssignmentStep)
  .then(directExecutionStep)
  .commit();
