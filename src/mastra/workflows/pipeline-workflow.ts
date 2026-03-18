import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

type TaskStatus = "todo" | "waiting_approval" | "in_progress" | "qa" | "done";

const taskIdSchema = z.object({
  taskId: z.string(),
});

const stepResultSchema = z.object({
  taskId: z.string(),
  status: z.string(),
});

const approvalResumeSchema = z.object({
  approved: z.boolean(),
});

const completionResumeSchema = z.object({
  completed: z.boolean(),
});

const retryResumeSchema = z.object({
  retry: z.boolean().optional(),
});

async function loadPrisma() {
  const modulePath = "@/db/prisma";
  return (await import(/* @vite-ignore */ modulePath)).default;
}

async function transitionTaskToNextAgent(
  taskId: string,
  nextRole: string,
  nextStatus: TaskStatus,
): Promise<void> {
  const prisma = await loadPrisma();
  const nextAgent = await prisma.agent.findFirst({ where: { role: nextRole } });
  if (!nextAgent) {
    throw new Error(`${nextRole} agent not found`);
  }
  await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: nextAgent.id, status: nextStatus },
  });
  console.log(`  🔀 [PIPELINE-STEP] Task transitioned → ${nextRole} (${nextStatus}) | task: ${taskId}`);
}

const generatePrdStep = createStep({
  id: "generate-prd",
  inputSchema: taskIdSchema,
  outputSchema: stepResultSchema,
  resumeSchema: retryResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    const { taskId } = inputData;
    console.log(`  🔄 [PIPELINE-STEP] generate-prd | task: ${taskId}${resumeData ? " (retry)" : ""}`);
    const { handlePrd } = await import("@/lib/pipeline");
    const result = await handlePrd(taskId);
    if (result === "error" || result === "clarification") {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending generate-prd (${result}) | task: ${taskId}`);
      return suspend({ taskId });
    }
    return { taskId, status: "completed" };
  },
});

const awaitPrdApprovalStep = createStep({
  id: "await-prd-approval",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    if (!resumeData) {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending for PRD approval | task: ${inputData.taskId}`);
      return suspend({ taskId: inputData.taskId });
    }
    console.log(`  ▶️ [PIPELINE-STEP] PRD approved, transitioning to Tech Lead | task: ${inputData.taskId}`);
    await transitionTaskToNextAgent(inputData.taskId, "Tech Lead", "todo");
    return { taskId: inputData.taskId, status: "approved" };
  },
});

const generateTechspecStep = createStep({
  id: "generate-techspec",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: retryResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    const { taskId } = inputData;
    console.log(`  🔄 [PIPELINE-STEP] generate-techspec | task: ${taskId}${resumeData ? " (retry)" : ""}`);
    const { handleTechspec } = await import("@/lib/pipeline");
    const result = await handleTechspec(taskId);
    if (result === "error") {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending generate-techspec (error) | task: ${taskId}`);
      return suspend({ taskId });
    }
    return { taskId, status: "completed" };
  },
});

const awaitTechspecApprovalStep = createStep({
  id: "await-techspec-approval",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    if (!resumeData) {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending for TechSpec approval | task: ${inputData.taskId}`);
      return suspend({ taskId: inputData.taskId });
    }
    console.log(`  ▶️ [PIPELINE-STEP] TechSpec approved, transitioning to Product Designer | task: ${inputData.taskId}`);
    await transitionTaskToNextAgent(inputData.taskId, "Product Designer", "todo");
    return { taskId: inputData.taskId, status: "approved" };
  },
});

const generateDesignStep = createStep({
  id: "generate-design",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: retryResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    const { taskId } = inputData;
    console.log(`  🔄 [PIPELINE-STEP] generate-design | task: ${taskId}${resumeData ? " (retry)" : ""}`);
    const { handleDesign } = await import("@/lib/pipeline");
    const result = await handleDesign(taskId);
    if (result === "error") {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending generate-design (error) | task: ${taskId}`);
      return suspend({ taskId });
    }
    return { taskId, status: "completed" };
  },
});

const awaitDesignApprovalStep = createStep({
  id: "await-design-approval",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: approvalResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    if (!resumeData) {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending for Design approval | task: ${inputData.taskId}`);
      return suspend({ taskId: inputData.taskId });
    }
    console.log(`  ▶️ [PIPELINE-STEP] Design approved, transitioning to Project Manager | task: ${inputData.taskId}`);
    await transitionTaskToNextAgent(inputData.taskId, "Project Manager", "in_progress");
    return { taskId: inputData.taskId, status: "approved" };
  },
});

const generateTaskBreakdownStep = createStep({
  id: "generate-task-breakdown",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: retryResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    const { taskId } = inputData;
    console.log(`  🔄 [PIPELINE-STEP] generate-task-breakdown | task: ${taskId}${resumeData ? " (retry)" : ""}`);
    const { handleTaskBreakdown } = await import("@/lib/pipeline");
    const result = await handleTaskBreakdown(taskId);
    if (result === "error") {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending generate-task-breakdown (error) | task: ${taskId}`);
      return suspend({ taskId });
    }
    return { taskId, status: "completed" };
  },
});

const awaitSubtasksCompletionStep = createStep({
  id: "await-subtasks-completion",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: completionResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    if (!resumeData) {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending for subtasks completion | task: ${inputData.taskId}`);
      return suspend({ taskId: inputData.taskId });
    }
    console.log(`  ▶️ [PIPELINE-STEP] Subtasks completed, continuing to QA | task: ${inputData.taskId}`);
    return { taskId: inputData.taskId, status: "subtasks-completed" };
  },
});

const qaReviewStep = createStep({
  id: "qa-review",
  inputSchema: stepResultSchema,
  outputSchema: stepResultSchema,
  resumeSchema: retryResumeSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    const { taskId } = inputData;
    console.log(`  🔄 [PIPELINE-STEP] qa-review | task: ${taskId}${resumeData ? " (retry)" : ""}`);
    const { handleQaReview } = await import("@/lib/pipeline");
    const result = await handleQaReview(taskId);
    if (result === "error") {
      console.log(`  ⏸️ [PIPELINE-STEP] Suspending qa-review (error) | task: ${taskId}`);
      return suspend({ taskId });
    }
    return { taskId, status: "completed" };
  },
});

export const pipelineWorkflow = createWorkflow({
  id: "pipeline-workflow",
  inputSchema: taskIdSchema,
  outputSchema: stepResultSchema,
})
  .then(generatePrdStep)
  .then(awaitPrdApprovalStep)
  .then(generateTechspecStep)
  .then(awaitTechspecApprovalStep)
  .then(generateDesignStep)
  .then(awaitDesignApprovalStep)
  .then(generateTaskBreakdownStep)
  .then(awaitSubtasksCompletionStep)
  .then(qaReviewStep)
  .commit();
