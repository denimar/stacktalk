-- AlterTable
ALTER TABLE "feed_messages" ADD COLUMN     "task_id" TEXT;

-- CreateIndex
CREATE INDEX "feed_messages_task_id_created_at_idx" ON "feed_messages"("task_id", "created_at");

-- AddForeignKey
ALTER TABLE "feed_messages" ADD CONSTRAINT "feed_messages_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
