# Task 3.0: Feed REST API (Messages + Threads)

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Implement the REST API endpoints for creating, reading, and editing feed messages, including thread replies. These endpoints persist data via Prisma and publish events to the SSE bus for real-time delivery. All endpoints require authentication via the existing cookie-based session.

<requirements>
- `GET /api/feed/messages?projectId=X&cursor=Y&limit=50` — Paginated feed messages (top-level only, cursor-based)
- `POST /api/feed/messages` — Create a new message or thread reply (body: `FeedMessagePayload`)
- `PUT /api/feed/messages/[id]` — Edit own message (ownership check: authorId must match session user)
- `GET /api/feed/messages/[id]/replies?cursor=Y` — Get paginated thread replies for a message
- All endpoints must validate the `session_user_id` cookie and return 401 if missing/invalid
- Creating a thread reply must increment `replyCount` on the parent message
- After successful create/edit, publish the corresponding SSE event (`message:created`, `message:updated`, `thread:reply`)
- Use cursor-based pagination with `createdAt` + `id` as cursor
- Return proper HTTP status codes: 200, 400, 401, 404, 422, 500
- Validate request body: content must be non-empty, projectId must exist
- Include author info (name, avatar, role) in message responses by joining with User/Agent tables
</requirements>

## Subtasks

- [ ] 3.1 Create `src/app/api/feed/messages/route.ts` with GET (list) and POST (create) handlers
- [ ] 3.2 Create `src/app/api/feed/messages/[id]/route.ts` with PUT (edit) handler
- [ ] 3.3 Create `src/app/api/feed/messages/[id]/replies/route.ts` with GET handler for thread replies
- [ ] 3.4 Implement authentication middleware (read `session_user_id` cookie, verify user exists)
- [ ] 3.5 Implement cursor-based pagination logic for messages and replies
- [ ] 3.6 Publish SSE events on create and edit operations
- [ ] 3.7 Write unit and integration tests for all endpoints

## Implementation Details

Refer to **techspec.md → API Endpoints** table and **techspec.md → Data flow** description.

Key implementation notes:
- The `authorType` for user-sent messages is always `"user"` and the `authorId` is the `session_user_id`
- For agent-sent messages, a separate internal API can set `authorType: "agent"` (but the public API always creates user messages)
- When creating a thread reply, use a Prisma transaction to both create the reply AND increment `replyCount` on the parent
- Cursor format: encode `createdAt` + `id` as a base64 string; decode on the server to use in WHERE clause
- Default limit is 50, max is 100
- Messages are ordered by `createdAt ASC` (oldest first, newest at bottom)
- Include author info by conditionally querying `User` or `Agent` table based on `authorType`

## Success Criteria

- All four endpoints respond correctly with proper status codes
- Unauthenticated requests return 401
- Creating a message persists it in the database and publishes an SSE event
- Creating a thread reply increments the parent's `replyCount`
- Editing a message owned by another user returns 403
- Cursor-based pagination returns correct pages in chronological order
- Empty content or missing projectId returns 400
- All tests pass

## Task Tests

- [ ] Unit test: POST creates a message and returns it with author info
- [ ] Unit test: POST with `parentMessageId` creates a thread reply and increments parent `replyCount`
- [ ] Unit test: PUT updates message content and sets `isEdited=true`, `editedAt`
- [ ] Unit test: PUT returns 403 when user tries to edit another user's message
- [ ] Unit test: GET returns paginated messages in chronological order
- [ ] Unit test: GET with cursor returns next page correctly
- [ ] Unit test: GET replies returns thread replies for a specific message
- [ ] Integration test: Unauthenticated requests to all endpoints return 401
- [ ] Integration test: Creating a message publishes `message:created` SSE event
- [ ] Integration test: Editing a message publishes `message:updated` SSE event
- [ ] Integration test: Full flow — create parent, add replies, verify replyCount, fetch thread

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `src/app/api/feed/messages/route.ts` — New file (GET + POST)
- `src/app/api/feed/messages/[id]/route.ts` — New file (PUT)
- `src/app/api/feed/messages/[id]/replies/route.ts` — New file (GET replies)
- `src/lib/feed-types.ts` — Type definitions (from Task 2.0)
- `src/lib/sse-bus.ts` — Event bus (from Task 2.0)
- `src/db/prisma.ts` — Prisma client instance
- `prisma/schema.prisma` — Data models (from Task 1.0)
