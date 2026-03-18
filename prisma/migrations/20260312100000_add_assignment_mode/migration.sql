-- CreateEnum
CREATE TYPE "AssignmentMode" AS ENUM ('pipeline', 'direct');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "assignment_mode" "AssignmentMode" NOT NULL DEFAULT 'pipeline';
