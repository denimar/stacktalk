# Technical Specification — Messaging Feed

## Executive Summary

The Messaging Feed introduces a Slack-style, project-scoped conversation interface where users and agents collaborate in real time. The architecture centers on new dedicated Prisma models (`FeedMessage`, `FeedThread`, `MessageAttachment`), a Server-Sent Events (SSE) transport for live updates, and AWS S3 for file/voice storage. The implementation is split into two phases: Phase 1 delivers the core feed, threads, composer, real-time, and editing; Phase 2 adds file attachments, voice messages, and @mentions.

## System Architecture

### Component Overview

- **FeedMessage / FeedThread / MessageAttachment** — New Prisma models purpose-built for the messaging feed. Decoupled from existing `ChatMessage` and `Conversation` models.
- **SSE Event Bus** (`src/lib/sse-bus.ts`) — In-memory event emitter that broadcasts message events to connected SSE clients, scoped by project.
- **Feed API Routes** (`src/app/api/feed/`) — REST endpoints for CRUD operations on messages, threads, and attachments. Mutations publish events to the SSE bus.
- **SSE Stream Route** (`src/app/api/feed/stream/route.ts`) — Long-lived SSE connection per client, delivering real-time message, thread, typing, and presence events.
- **S3 Upload Service** (`src/lib/s3-upload.ts`) — Generates presigned URLs for direct browser-to-S3 uploads and validates file metadata server-side. *(Phase 2)*
- **MessageFeed** (`src/components/feed/`) — React component tree: `MessageFeed` (virtualized list), `MessageComposer`, `ThreadPanel`, `MessageBubble`, `MentionAutocomplete`. *(MentionAutocomplete in Phase 2)*
- **useFeedSSE hook** (`src/hooks/use-feed-sse.ts`) — Custom hook managing the EventSource connection, reconnection, and dispatching incoming events to local state.

**Data flow:** User types message → `MessageComposer` calls `POST /api/feed/messages` → API persists via Prisma → API publishes to SSE bus → SSE stream pushes event to all connected clients → `useFeedSSE` updates local state → `MessageFeed` re-renders.

## Implementation Design

### Key Interfaces

```typescript
// src/lib/feed-types.ts
interface FeedMessagePayload {
  content: string;
  projectId: string;
  parentMessageId?: string; // if thread reply
  authorType: "user" | "agent";
  authorId: string;
}

interface SSEEvent {
  type: "message:created" | "message:updated" | "thread:reply" | "typing" | "presence";
  payload: Record<string, unknown>;
  projectId: string;
}

interface FeedStreamParams {
  projectId: string;
  lastEventId?: string; // for reconnection
}
```

```typescript
// src/hooks/use-feed-sse.ts
function useFeedSSE(projectId: string): {
  messages: FeedMessage[];
  threadMessages: Map<string, FeedMessage[]>;
  typingUsers: string[];
  isConnected: boolean;
  sendMessage: (content: string, parentId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
}
```

### Data Models

New Prisma models (added to `schema.prisma`):

```prisma
model FeedMessage {
  id              String              @id @default(uuid())
  content         String              @db.Text
  authorType      AuthorType          @map("author_type")
  authorId        String              @map("author_id")
  projectId       String              @map("project_id")
  project         Project             @relation("ProjectFeedMessages", fields: [projectId], references: [id])
  parentMessageId String?             @map("parent_message_id")
  parentMessage   FeedMessage?        @relation("ThreadReplies", fields: [parentMessageId], references: [id])
  replies         FeedMessage[]       @relation("ThreadReplies")
  replyCount      Int                 @default(0) @map("reply_count")
  isEdited        Boolean             @default(false) @map("is_edited")
  editedAt        DateTime?           @map("edited_at")
  attachments     MessageAttachment[]
  mentions        MessageMention[]
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  @@index([projectId, createdAt])
  @@index([parentMessageId, createdAt])
  @@map("feed_messages")
}

model MessageAttachment {
  id             String      @id @default(uuid())
  messageId      String      @map("message_id")
  message        FeedMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  fileName       String      @map("file_name")
  fileType       String      @map("file_type")
  fileSize       Int         @map("file_size")
  s3Key          String      @map("s3_key")
  attachmentType String      @map("attachment_type") // "image" | "document" | "voice"
  createdAt      DateTime    @default(now()) @map("created_at")

  @@index([messageId])
  @@map("message_attachments")
}

model MessageMention {
  id          String      @id @default(uuid())
  messageId   String      @map("message_id")
  message     FeedMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  targetType  AuthorType  @map("target_type")
  targetId    String      @map("target_id")
  createdAt   DateTime    @default(now()) @map("created_at")

  @@index([targetId, targetType])
  @@index([messageId])
  @@map("message_mentions")
}
```

**Note:** Add `feedMessages FeedMessage[] @relation("ProjectFeedMessages")` to the existing `Project` model.

### API Endpoints

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `GET` | `/api/feed/messages?projectId=X&cursor=Y&limit=50` | Paginated feed messages (cursor-based) | 1 |
| `POST` | `/api/feed/messages` | Create message or thread reply | 1 |
| `PUT` | `/api/feed/messages/[id]` | Edit own message | 1 |
| `GET` | `/api/feed/messages/[id]/replies?cursor=Y` | Get thread replies | 1 |
| `GET` | `/api/feed/stream?projectId=X` | SSE stream connection | 1 |
| `POST` | `/api/feed/typing` | Broadcast typing indicator | 1 |
| `POST` | `/api/feed/attachments/presign` | Get S3 presigned upload URL | 2 |
| `POST` | `/api/feed/attachments/confirm` | Confirm upload and link to message | 2 |
| `GET` | `/api/feed/mentions/search?q=X&projectId=Y` | Search users/agents for @mention | 2 |

## Integration Points

- **AWS S3** *(Phase 2)*: Direct browser upload via presigned URLs. Server validates file type (allowlist: PNG, JPG, GIF, WebP, SVG, PDF, DOC, DOCX, TXT, WebM, MP3) and size (max 25MB). Uses existing AWS credentials from `.env`.
- **Prisma/PostgreSQL**: All message persistence. Existing `User` and `Agent` tables referenced by `authorId` + `authorType` (polymorphic, same pattern as existing `Comment` model).
- **Authentication**: Reuses existing cookie-based session (`session_user_id`). SSE endpoint validates session before establishing stream.
- **Browser MediaRecorder API** *(Phase 2)*: Records voice messages as WebM/Opus. Uploaded to S3 as `attachmentType: "voice"`.

## Testing Approach

### Unit Tests

- **SSE Bus**: Test event publishing, subscription, unsubscription, and project-scoped filtering.
- **Feed API handlers**: Test message creation, editing (ownership check), pagination (cursor logic), thread reply count increment.
- **useFeedSSE hook**: Test EventSource lifecycle, reconnection, and state updates using mock EventSource.
- **MessageComposer**: Test Enter/Shift+Enter behavior, empty message prevention.

### Integration Tests

- **Message flow**: Create message via API → verify SSE event received → verify database state.
- **Thread flow**: Create parent → add replies → verify `replyCount` incremented → fetch thread.
- **Auth enforcement**: Verify unauthenticated requests return 401 on all feed endpoints.
- **Edit ownership**: Verify users cannot edit messages they don't own.

### E2E Tests

- **Full send/receive flow** using Playwright: User A sends message → verify it appears in feed → User A opens thread → sends reply → verify thread panel updates.
- **Message editing** using Playwright: Send message → hover → click edit → modify → verify "(edited)" label.

## Development Sequencing

### Build Order

1. **Prisma schema + migration** — Add `FeedMessage`, `MessageAttachment`, `MessageMention` models. Run migration. *(Foundation for everything)*
2. **SSE Event Bus** (`src/lib/sse-bus.ts`) — In-memory pub/sub with project scoping. *(Required by all real-time features)*
3. **Feed REST API** — `GET/POST/PUT /api/feed/messages`, thread replies endpoint. *(Backend must exist before frontend)*
4. **SSE Stream endpoint** — `/api/feed/stream` with session auth and reconnection via `Last-Event-ID`. *(Enables real-time on frontend)*
5. **MessageFeed + MessageBubble components** — Virtualized message list with `@tanstack/react-virtual` or `react-virtuoso`. *(Core UI)*
6. **MessageComposer** — Text input with Enter/Shift+Enter, rich text toolbar (bold, italic, code). *(Send messages)*
7. **ThreadPanel** — Right-side slide-in panel showing parent + replies. *(Threaded conversations)*
8. **Typing indicators + presence** — Ephemeral SSE events, debounced. *(Polish)*
9. **Message editing** — Inline edit mode with "(edited)" badge. *(Complete Phase 1)*
10. **Phase 2**: S3 presigned upload → file attachments → voice recording → @mentions autocomplete.

### Technical Dependencies

- `@tanstack/react-virtual` or `react-virtuoso` — Virtualized scrolling for 1,000+ messages.
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` — S3 presigned URL generation. *(Phase 2)*
- No additional server dependencies for SSE (native Web Streams API in Next.js App Router).

## Technical Considerations

### Key Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| New models instead of extending `ChatMessage`/`Conversation` | Clean separation; existing models serve different purposes (1:1 agent chat vs. project feed). No risk of breaking existing features. | Extending existing models — would create coupling between unrelated features. |
| SSE over WebSocket/Socket.io | Next.js App Router natively supports streaming responses. No extra server needed. Mutations go through REST (already the project pattern). One-way push is sufficient. | Socket.io — adds bundle size + server complexity for bidirectional that isn't needed. |
| Cursor-based pagination over offset | Stable pagination as new messages arrive. Uses `createdAt` + `id` as cursor. | Offset pagination — shifts when new messages are inserted. |
| Polymorphic `authorType` + `authorId` | Matches existing `Comment` model pattern. Avoids separate FK columns for users and agents. | Separate `userId`/`agentId` nullable FKs — more columns, same information. |
| In-memory SSE bus (not Redis) | Single-server deployment for now. No Redis infrastructure exists. Easy to swap to Redis pub/sub later if horizontal scaling is needed. | Redis pub/sub — over-engineering for current scale. |

### Known Risks

- **SSE connection limits**: Browsers limit ~6 SSE connections per domain. Mitigate by using a single SSE connection per tab that multiplexes all project events.
- **In-memory bus data loss on restart**: Typing indicators and presence are ephemeral (acceptable). Messages are persisted to DB before broadcasting, so no message loss.
- **Large thread performance**: Threads with 500+ replies could be slow. Mitigate with cursor-based pagination inside threads.
- **Voice recording browser support**: MediaRecorder API not available in all browsers. Must detect support and hide voice button gracefully. *(Phase 2)*

### Standards Compliance

- **react.md**: Functional components, TypeScript `.tsx`, explicit props, Tailwind styling, custom hooks with `use` prefix, shadcn/ui components.
- **code-standards.md**: camelCase for functions/variables, PascalCase for interfaces, kebab-case for files, no magic numbers, early returns, max 50-line functions / 300-line components.
- **http.md**: REST pattern with plural resource names, JSON payloads, proper status codes (200, 400, 401, 404, 422, 500), cookie-based auth middleware.
- **logging.md**: Structured log objects with context, `console.log`/`console.error` only, no sensitive data in logs.
- **tests.md**: Jest with AAA pattern, independent tests, clear naming, full coverage of API handlers and hooks.
- **node.md**: TypeScript only, `const`/`let` (no `var`), `async/await`, no `any`, named exports for multi-export files.

### Relevant and Dependent Files

**Existing files to modify:**
- `prisma/schema.prisma` — Add new models, add relation to `Project`
- `src/lib/types.ts` — Add feed-related TypeScript types
- `src/app/layout.tsx` — May need layout adjustment for feed page
- `src/components/AppShell.tsx` — Navigation to messaging feed

**New files to create:**
- `prisma/migrations/XXXXXX_add_feed_messages/` — Migration
- `src/lib/feed-types.ts` — Feed-specific types and interfaces
- `src/lib/sse-bus.ts` — SSE event bus
- `src/lib/s3-upload.ts` — S3 presigned URL service *(Phase 2)*
- `src/app/api/feed/messages/route.ts` — Feed messages API
- `src/app/api/feed/messages/[id]/route.ts` — Single message API (edit)
- `src/app/api/feed/messages/[id]/replies/route.ts` — Thread replies API
- `src/app/api/feed/stream/route.ts` — SSE stream endpoint
- `src/app/api/feed/typing/route.ts` — Typing indicator endpoint
- `src/app/api/feed/attachments/presign/route.ts` — Presigned URL *(Phase 2)*
- `src/app/api/feed/attachments/confirm/route.ts` — Confirm upload *(Phase 2)*
- `src/app/api/feed/mentions/search/route.ts` — Mention search *(Phase 2)*
- `src/hooks/use-feed-sse.ts` — SSE connection hook
- `src/app/feed/page.tsx` — Feed page
- `src/components/feed/message-feed.tsx` — Virtualized message list
- `src/components/feed/message-bubble.tsx` — Single message display
- `src/components/feed/message-composer.tsx` — Input area with toolbar
- `src/components/feed/thread-panel.tsx` — Right-side thread view
- `src/components/feed/typing-indicator.tsx` — "User is typing..." display
- `src/components/feed/mention-autocomplete.tsx` — @mention dropdown *(Phase 2)*
- `src/components/feed/voice-recorder.tsx` — Voice recording UI *(Phase 2)*
- `src/components/feed/attachment-preview.tsx` — File/image preview *(Phase 2)*
