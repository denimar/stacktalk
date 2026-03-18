-- RenameTable
ALTER TABLE "openrouter_models" RENAME TO "models";

-- RenameIndex
ALTER INDEX "openrouter_models_pkey" RENAME TO "models_pkey";
ALTER INDEX "openrouter_models_slug_key" RENAME TO "models_slug_key";
