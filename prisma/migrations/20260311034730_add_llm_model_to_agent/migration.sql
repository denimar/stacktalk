-- Step 1: Insert deepseek-coder model if it doesn't exist
INSERT INTO "llm_models" ("id", "provider", "name", "code", "category", "description", "context_window", "max_output", "supports_vision", "supports_tools", "active", "created_at", "updated_at")
SELECT gen_random_uuid(), 'deepseek', 'DeepSeek Coder V2', 'deepseek-coder', 'balanced', 'Specialized coding model. Optimized for code generation, completion, and understanding. Cost-effective for development tasks.', 128000, 8192, false, true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "llm_models" WHERE "code" = 'deepseek-coder');

-- Step 2: Add llm_model_id column as nullable
ALTER TABLE "agents" ADD COLUMN "llm_model_id" TEXT;

-- Step 3: Backfill - Frontend/Backend Developers get deepseek-coder
UPDATE "agents" SET "llm_model_id" = (
  SELECT id FROM "llm_models" WHERE code = 'deepseek-coder'
) WHERE role IN ('Frontend Developer', 'Backend Developer');

-- Step 4: Backfill - All others get deepseek-chat
UPDATE "agents" SET "llm_model_id" = (
  SELECT id FROM "llm_models" WHERE code = 'deepseek-chat'
) WHERE "llm_model_id" IS NULL;

-- Step 5: Make column NOT NULL
ALTER TABLE "agents" ALTER COLUMN "llm_model_id" SET NOT NULL;

-- Step 6: Add foreign key constraint
ALTER TABLE "agents" ADD CONSTRAINT "agents_llm_model_id_fkey" FOREIGN KEY ("llm_model_id") REFERENCES "llm_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
