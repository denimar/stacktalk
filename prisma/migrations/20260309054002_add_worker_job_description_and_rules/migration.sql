-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "job_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "rules" TEXT NOT NULL DEFAULT '';
