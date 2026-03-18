type PipelineResult = "completed" | "error" | "clarification";

export async function handlePrd(taskId: string): Promise<PipelineResult> {
  throw new Error(`handlePrd not implemented for task ${taskId}`);
}

export async function handleTechspec(taskId: string): Promise<PipelineResult> {
  throw new Error(`handleTechspec not implemented for task ${taskId}`);
}

export async function handleDesign(taskId: string): Promise<PipelineResult> {
  throw new Error(`handleDesign not implemented for task ${taskId}`);
}

export async function handleTaskBreakdown(taskId: string): Promise<PipelineResult> {
  throw new Error(`handleTaskBreakdown not implemented for task ${taskId}`);
}

export async function handleQaReview(taskId: string): Promise<PipelineResult> {
  throw new Error(`handleQaReview not implemented for task ${taskId}`);
}

export async function handleSubtaskExecution(taskId: string): Promise<PipelineResult> {
  throw new Error(`handleSubtaskExecution not implemented for task ${taskId}`);
}

export async function handleDirectAssignment(taskId: string): Promise<PipelineResult> {
  throw new Error(`handleDirectAssignment not implemented for task ${taskId}`);
}

export async function handleDirectExecution(taskId: string, createdByName?: string): Promise<PipelineResult> {
  throw new Error(`handleDirectExecution not implemented for task ${taskId}, createdBy: ${createdByName}`);
}
