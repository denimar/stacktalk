-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('todo', 'waiting_approval', 'in_progress', 'qa', 'done');
ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "tasks" SET "status" = 'todo' WHERE "status" = 'backlog';
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "TaskStatus_old";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo';
COMMIT;
