-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('anthropic', 'openai', 'google', 'meta', 'mistral', 'deepseek');

-- CreateEnum
CREATE TYPE "LlmCategory" AS ENUM ('flagship', 'balanced', 'fast', 'reasoning');

-- CreateTable
CREATE TABLE "llm_models" (
    "id" TEXT NOT NULL,
    "provider" "LlmProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "LlmCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "context_window" INTEGER NOT NULL,
    "max_output" INTEGER NOT NULL,
    "supports_vision" BOOLEAN NOT NULL DEFAULT false,
    "supports_tools" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "llm_models_code_key" ON "llm_models"("code");
