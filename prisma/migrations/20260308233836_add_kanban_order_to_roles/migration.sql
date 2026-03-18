-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "kanban_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "workers" RENAME CONSTRAINT "users_pkey" TO "workers_pkey";
