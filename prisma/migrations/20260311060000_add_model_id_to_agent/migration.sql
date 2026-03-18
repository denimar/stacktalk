-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "model_id" TEXT;

-- Set random model_id for all existing agents
UPDATE "agents" SET "model_id" = (SELECT "id" FROM "models" ORDER BY RANDOM() LIMIT 1);

-- Make model_id required
ALTER TABLE "agents" ALTER COLUMN "model_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
