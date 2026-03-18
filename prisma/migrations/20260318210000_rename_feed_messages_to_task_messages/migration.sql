-- RenameTable
ALTER TABLE "feed_messages" RENAME TO "task_messages";

-- RenameIndex
ALTER INDEX "feed_messages_pkey" RENAME TO "task_messages_pkey";
ALTER INDEX "feed_messages_project_id_created_at_idx" RENAME TO "task_messages_project_id_created_at_idx";
ALTER INDEX "feed_messages_parent_message_id_created_at_idx" RENAME TO "task_messages_parent_message_id_created_at_idx";
ALTER INDEX "feed_messages_task_id_created_at_idx" RENAME TO "task_messages_task_id_created_at_idx";

-- RenameForeignKey
ALTER TABLE "task_messages" RENAME CONSTRAINT "feed_messages_project_id_fkey" TO "task_messages_project_id_fkey";
ALTER TABLE "task_messages" RENAME CONSTRAINT "feed_messages_parent_message_id_fkey" TO "task_messages_parent_message_id_fkey";
ALTER TABLE "task_messages" RENAME CONSTRAINT "feed_messages_task_id_fkey" TO "task_messages_task_id_fkey";

-- UpdateForeignKeysFromOtherTables
ALTER TABLE "message_attachments" DROP CONSTRAINT "message_attachments_message_id_fkey";
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "task_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_mentions" DROP CONSTRAINT "message_mentions_message_id_fkey";
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "task_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
