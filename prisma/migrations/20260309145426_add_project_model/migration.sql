-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "git_repository" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- Step 1: Add project_id as nullable
ALTER TABLE "tasks" ADD COLUMN "project_id" TEXT;

-- Step 2: Insert default "Unassigned" project
INSERT INTO "projects" ("id", "name", "git_repository", "description", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'Unassigned', '', 'Default project for existing tasks', NOW(), NOW());

-- Step 3: Assign all existing tasks to the default project
UPDATE "tasks" SET "project_id" = (SELECT "id" FROM "projects" WHERE "name" = 'Unassigned' LIMIT 1);

-- Step 4: Make project_id non-nullable
ALTER TABLE "tasks" ALTER COLUMN "project_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
