import prisma from "../src/db/prisma";
import { agents, projects, tasks, users, groups, userGroupAssignments, userProjectAssignments } from "./seed-data";
import type { Permission } from "../src/generated/prisma/client";
import { openRouterModels } from "./seed-models";
import { hashPassword } from "../src/lib/auth";

async function seedAgents() {
  for (const agent of agents) {
    const existing = await prisma.agent.findUnique({ where: { role: agent.role } });
    if (!existing) {
      const defaultModel = await prisma.model.findFirst({ where: { slug: "anthropic/claude-haiku-4.5" } })
        ?? await prisma.model.findFirst({ orderBy: { createdAt: "desc" } });
      if (!defaultModel) {
        console.error(`No models found, skipping agent "${agent.name}"`);
        continue;
      }
      await prisma.agent.create({
        data: {
          name: agent.name,
          avatar: agent.avatar,
          role: agent.role,
          kanbanOrder: agent.kanbanOrder,
          color: agent.color,
          generateEndpoint: agent.generateEndpoint ?? null,
          modelId: defaultModel.id,
        },
      });
      console.log(`Created agent "${agent.name}" (${agent.role})`);
    } else {
      const needsUpdate =
        existing.name !== agent.name ||
        existing.avatar !== agent.avatar ||
        existing.kanbanOrder !== agent.kanbanOrder ||
        existing.color !== agent.color ||
        (agent.generateEndpoint !== undefined && existing.generateEndpoint !== agent.generateEndpoint);
      if (!needsUpdate) continue;
      await prisma.agent.update({
        where: { id: existing.id },
        data: {
          name: agent.name,
          avatar: agent.avatar,
          kanbanOrder: agent.kanbanOrder,
          color: agent.color,
          ...(agent.generateEndpoint !== undefined && { generateEndpoint: agent.generateEndpoint }),
        },
      });
      console.log(`Updated agent "${agent.name}" (${agent.role})`);
    }
  }
}

async function seedProjects() {
  for (const project of projects) {
    const existing = await prisma.project.findFirst({ where: { name: project.name, deletedAt: null } });
    if (!existing) {
      await prisma.project.create({
        data: {
          name: project.name,
          gitRepository: project.gitRepository,
          description: project.description,
        },
      });
      console.log(`Created project "${project.name}"`);
    } else {
      const needsUpdate =
        existing.gitRepository !== project.gitRepository ||
        existing.description !== project.description;
      if (!needsUpdate) continue;
      await prisma.project.update({
        where: { id: existing.id },
        data: {
          gitRepository: project.gitRepository,
          description: project.description,
        },
      });
      console.log(`Updated project "${project.name}"`);
    }
  }
}

async function seedTasks() {
  const dbAgents = await prisma.agent.findMany();
  const agentByRole = new Map(dbAgents.map((a) => [a.role, a.id]));
  const dbProjects = await prisma.project.findMany({ where: { deletedAt: null } });
  const projectByName = new Map(dbProjects.map((p) => [p.name, p.id]));
  const dbUsers = await prisma.user.findMany();
  const userIds = dbUsers.map((u) => u.id);
  const existingTasks = await prisma.task.findMany({
    select: { title: true },
  });
  const existingTitles = new Set(existingTasks.map((t) => t.title));
  let tasksCreated = 0;
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (existingTitles.has(task.title)) continue;
    const assigneeId = agentByRole.get(task.assigneeRole);
    if (!assigneeId) {
      console.error(`Agent not found for role "${task.assigneeRole}", skipping task "${task.title}"`);
      continue;
    }
    const projectId = projectByName.get(task.projectName);
    if (!projectId) {
      console.error(`Project not found "${task.projectName}", skipping task "${task.title}"`);
      continue;
    }
    const createdById = userIds.length > 0 ? userIds[i % userIds.length] : undefined;
    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        assigneeId,
        projectId,
        ...(createdById && { createdById }),
      },
    });
    tasksCreated++;
  }
  console.log(`Created ${tasksCreated} tasks (${existingTitles.size} already existed)`);
}

async function seedUsers() {
  const defaultPassword = await hashPassword("123456789");
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          password: defaultPassword,
        },
      });
      console.log(`Created user "${user.name}" (${user.role})`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          password: defaultPassword,
        },
      });
      console.log(`Updated user "${user.name}" (${user.role})`);
    }
  }
}

async function seedModels() {
  let created = 0;
  let updated = 0;
  for (const model of openRouterModels) {
    const existing = await prisma.model.findUnique({ where: { slug: model.slug } });
    if (!existing) {
      await prisma.model.create({ data: model });
      created++;
    } else {
      const needsUpdate =
        existing.name !== model.name ||
        existing.shortName !== model.shortName ||
        existing.description !== model.description ||
        existing.contextLength !== model.contextLength ||
        existing.promptPrice !== model.promptPrice ||
        existing.completionPrice !== model.completionPrice ||
        existing.imagePrice !== model.imagePrice ||
        existing.requestPrice !== model.requestPrice ||
        existing.inputCacheReadPrice !== model.inputCacheReadPrice ||
        existing.inputCacheWritePrice !== model.inputCacheWritePrice ||
        existing.webSearchPrice !== model.webSearchPrice ||
        existing.internalReasoningPrice !== model.internalReasoningPrice ||
        existing.supportsReasoning !== model.supportsReasoning;
      if (!needsUpdate) continue;
      await prisma.model.update({
        where: { id: existing.id },
        data: model,
      });
      updated++;
    }
  }
  console.log(`Models: ${created} created, ${updated} updated (${openRouterModels.length - created - updated} unchanged)`);
}

async function seedGroups() {
  for (const group of groups) {
    await prisma.group.upsert({
      where: { name: group.name },
      create: {
        name: group.name,
        description: group.description,
        permissions: group.permissions as Permission[],
      },
      update: {
        description: group.description,
        permissions: group.permissions as Permission[],
      },
    });
    console.log(`Upserted group "${group.name}"`);
  }
}

async function seedUserGroups() {
  let created = 0;
  let skipped = 0;
  for (const assignment of userGroupAssignments) {
    const user = await prisma.user.findUnique({ where: { email: assignment.userEmail } });
    const group = await prisma.group.findUnique({ where: { name: assignment.groupName } });
    if (!user || !group) {
      console.error(`Skipping user-group assignment: user=${assignment.userEmail}, group=${assignment.groupName}`);
      skipped++;
      continue;
    }
    const existing = await prisma.userGroup.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.userGroup.create({
      data: { userId: user.id, groupId: group.id },
    });
    created++;
  }
  console.log(`User-group assignments: ${created} created, ${skipped} skipped`);
}

async function seedUserProjects() {
  let created = 0;
  let skipped = 0;
  for (const assignment of userProjectAssignments) {
    const user = await prisma.user.findUnique({ where: { email: assignment.userEmail } });
    const project = await prisma.project.findFirst({ where: { name: assignment.projectName, deletedAt: null } });
    if (!user || !project) {
      console.error(`Skipping user-project assignment: user=${assignment.userEmail}, project=${assignment.projectName}`);
      skipped++;
      continue;
    }
    const existing = await prisma.userProject.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: project.id } },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.userProject.create({
      data: { userId: user.id, projectId: project.id },
    });
    created++;
  }
  console.log(`User-project assignments: ${created} created, ${skipped} skipped`);
}

async function backfillTaskCreatedBy() {
  const tasksWithoutCreator = await prisma.task.findMany({
    where: { createdById: null },
    select: { id: true },
  });
  if (tasksWithoutCreator.length === 0) return;
  const dbUsers = await prisma.user.findMany({ select: { id: true } });
  if (dbUsers.length === 0) return;
  const userIds = dbUsers.map((u) => u.id);
  let updated = 0;
  for (let i = 0; i < tasksWithoutCreator.length; i++) {
    await prisma.task.update({
      where: { id: tasksWithoutCreator[i].id },
      data: { createdById: userIds[i % userIds.length] },
    });
    updated++;
  }
  console.log(`Backfilled createdBy for ${updated} tasks`);
}

async function main() {
  await seedModels();
  await seedAgents();
  await seedUsers();
  await seedProjects();
  await seedTasks();
  await seedGroups();
  await seedUserGroups();
  await seedUserProjects();
  await backfillTaskCreatedBy();
}

main()
  .catch((error) => {
    console.error("Seed failed", { error });
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
