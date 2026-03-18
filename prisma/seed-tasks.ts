import prisma from "../src/db/prisma";
import { tasks } from "./seed-data";

async function main() {
  const agents = await prisma.agent.findMany();
  const agentByRole = new Map(
    agents.map((a) => [a.role, a.id])
  );
  const allProjects = await prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  if (allProjects.length === 0) {
    throw new Error("No projects found. Run the main seed first.");
  }
  const projectIds = allProjects.map((p) => p.id);
  const existingTasks = await prisma.task.findMany({
    select: { title: true },
  });
  const existingTitles = new Set(existingTasks.map((t) => t.title));
  let created = 0;
  for (const task of tasks) {
    if (existingTitles.has(task.title)) continue;
    const assigneeId = agentByRole.get(task.assigneeRole);
    if (!assigneeId) {
      console.error(`Agent not found for role "${task.assigneeRole}", skipping task "${task.title}"`);
      continue;
    }
    const randomProjectId = projectIds[Math.floor(Math.random() * projectIds.length)];
    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        assigneeId,
        projectId: randomProjectId,
      },
    });
    created++;
  }
  console.log(`Created ${created} tasks across ${projectIds.length} projects (${existingTitles.size} already existed)`);
}

main()
  .catch((error) => {
    console.error("Task seed failed", { error });
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
