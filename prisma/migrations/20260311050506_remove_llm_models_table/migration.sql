/*
  Warnings:

  - You are about to drop the column `llm_model_id` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the `llm_models` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_llm_model_id_fkey";

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "llm_model_id";

-- DropTable
DROP TABLE "llm_models";

-- DropEnum
DROP TYPE "LlmCategory";

-- DropEnum
DROP TYPE "LlmProvider";
