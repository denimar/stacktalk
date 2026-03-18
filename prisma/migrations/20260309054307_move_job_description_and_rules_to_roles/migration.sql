-- AlterTable: Add job_description and rules to roles
ALTER TABLE "roles" ADD COLUMN "job_description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "roles" ADD COLUMN "rules" TEXT NOT NULL DEFAULT '';

-- Migrate data from workers to roles
UPDATE "roles" r
SET "job_description" = w."job_description"
FROM "workers" w
WHERE w."role_id" = r."id" AND w."job_description" != '';

-- AlterTable: Remove job_description and rules from workers
ALTER TABLE "workers" DROP COLUMN "job_description";
ALTER TABLE "workers" DROP COLUMN "rules";
