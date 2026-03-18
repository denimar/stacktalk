import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const subtaskInputSchema = z.object({
  taskId: z.string(),
});

const subtaskOutputSchema = z.object({
  taskId: z.string(),
  status: z.string(),
});

const executeSubtaskStep = createStep({
  id: "execute-subtask",
  inputSchema: subtaskInputSchema,
  outputSchema: subtaskOutputSchema,
  execute: async ({ inputData }) => {
    const { taskId } = inputData;
    console.log(`  🔄 [SUBTASK-STEP] execute-subtask | task: ${taskId}`);
    const { handleSubtaskExecution } = await import("@/lib/pipeline");
    const result = await handleSubtaskExecution(taskId);
    console.log(`  ${result === "completed" ? "✅" : "❌"} [SUBTASK-STEP] Subtask ${result} | task: ${taskId}`);
    return { taskId, status: result };
  },
});

export const subtaskWorkflow = createWorkflow({
  id: "subtask-workflow",
  inputSchema: subtaskInputSchema,
  outputSchema: subtaskOutputSchema,
})
  .then(executeSubtaskStep)
  .commit();
