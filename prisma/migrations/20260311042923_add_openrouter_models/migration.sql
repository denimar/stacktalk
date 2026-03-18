-- CreateTable
CREATE TABLE "openrouter_models" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "context_length" INTEGER NOT NULL,
    "max_prompt_tokens" INTEGER,
    "max_completion_tokens" INTEGER,
    "input_modalities" TEXT[],
    "output_modalities" TEXT[],
    "group" TEXT NOT NULL DEFAULT '',
    "supports_reasoning" BOOLEAN NOT NULL DEFAULT false,
    "prompt_price" TEXT NOT NULL DEFAULT '0',
    "completion_price" TEXT NOT NULL DEFAULT '0',
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "permaslug" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openrouter_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "openrouter_models_slug_key" ON "openrouter_models"("slug");
