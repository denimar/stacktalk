-- RenameTable
ALTER TABLE "users" RENAME TO "workers";

-- UpdateForeignKey: workers -> roles (rename constraint from users_ to workers_)
ALTER TABLE "workers" DROP CONSTRAINT "users_role_id_fkey";
ALTER TABLE "workers" ADD CONSTRAINT "workers_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- UpdateForeignKey: tasks -> workers (update reference from users to workers)
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignee_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
