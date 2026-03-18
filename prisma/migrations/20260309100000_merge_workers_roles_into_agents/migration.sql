-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL,
    "job_description" TEXT NOT NULL DEFAULT '',
    "rules" TEXT NOT NULL DEFAULT '',
    "kanban_order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_role_key" ON "agents"("role");

-- Migrate data from workers + roles into agents
INSERT INTO "agents" ("id", "name", "avatar", "role", "job_description", "rules", "kanban_order", "color", "created_at", "updated_at")
SELECT w."id", w."name", w."avatar", r."name", r."job_description", r."rules", r."kanban_order", r."color", w."created_at", w."updated_at"
FROM "workers" w
JOIN "roles" r ON w."role_id" = r."id";

-- Update tasks to reference agents (same IDs as workers, so no change needed for assignee_id)

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignee_id_fkey";

-- DropForeignKey
ALTER TABLE "workers" DROP CONSTRAINT "workers_role_id_fkey";

-- DropTable
DROP TABLE "workers";

-- DropTable
DROP TABLE "roles";

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
