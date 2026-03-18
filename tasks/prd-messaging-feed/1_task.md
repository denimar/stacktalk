# Task 1.0: Prisma Schema & Migration

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Add the `FeedMessage`, `MessageAttachment`, and `MessageMention` Prisma models to the database schema and run the migration. This is the foundation for the entire Messaging Feed feature — all subsequent tasks depend on these tables existing.

<requirements>
- Add `FeedMessage` model with all fields specified in techspec.md (id, content, authorType, authorId, projectId, parentMessageId, replyCount, isEdited, editedAt, createdAt, updatedAt)
- Add `MessageAttachment` model with fields: id, messageId, fileName, fileType, fileSize, s3Key, attachmentType, createdAt
- Add `MessageMention` model with fields: id, messageId, targetType, targetId, createdAt
- Add `feedMessages` relation to the existing `Project` model
- Use the existing `AuthorType` enum for authorType/targetType fields
- Self-referential relation on `FeedMessage` for thread replies (parentMessageId → id)
- Add proper indexes for query performance (projectId+createdAt, parentMessageId+createdAt, messageId, targetId+targetType)
- Use `@@map` for snake_case table names and `@map` for snake_case column names (matching existing conventions)
- Run the migration successfully against the PostgreSQL database
</requirements>

## Subtasks

- [ ] 1.1 Add `FeedMessage` model to `prisma/schema.prisma` with all fields, relations, and indexes as specified in techspec.md
- [ ] 1.2 Add `MessageAttachment` model to `prisma/schema.prisma` with cascade delete on message relation
- [ ] 1.3 Add `MessageMention` model to `prisma/schema.prisma` with cascade delete on message relation
- [ ] 1.4 Add `feedMessages FeedMessage[] @relation("ProjectFeedMessages")` to the existing `Project` model
- [ ] 1.5 Run `npx prisma migrate dev --name add_feed_messages` to generate and apply the migration
- [ ] 1.6 Verify the generated Prisma client includes the new models (`npx prisma generate`)

## Implementation Details

Refer to **techspec.md → Data Models** section for the exact Prisma schema definitions. Key points:

- `FeedMessage` uses a self-referential relation called `"ThreadReplies"` for parent/child thread structure
- The `Project` model relation uses the name `"ProjectFeedMessages"`
- All table names use `@@map("feed_messages")`, `@@map("message_attachments")`, `@@map("message_mentions")`
- The `content` field uses `@db.Text` for long messages
- `replyCount` is denormalized for performance (avoids COUNT queries on every message render)

## Success Criteria

- Migration runs without errors
- Prisma client generates successfully with new models
- All three new tables exist in the database with correct columns and indexes
- The `Project` model has the `feedMessages` relation
- Existing models and data are not affected

## Task Tests

- [ ] Unit tests: Verify Prisma client can create, read, update `FeedMessage` records
- [ ] Unit tests: Verify `FeedMessage` self-relation (parent/child threads) works correctly
- [ ] Unit tests: Verify `MessageAttachment` cascade deletes when parent `FeedMessage` is deleted
- [ ] Unit tests: Verify `MessageMention` cascade deletes when parent `FeedMessage` is deleted
- [ ] Integration tests: Create a full message → reply → attachment chain and verify all relations resolve

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `prisma/schema.prisma` — Add new models here
- `src/generated/prisma/` — Auto-generated Prisma client (regenerated after migration)
- `src/db/prisma.ts` — Prisma singleton instance
