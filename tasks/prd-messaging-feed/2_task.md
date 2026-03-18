# Task 2.0: Feed Types & SSE Event Bus

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Create the TypeScript type definitions for the Messaging Feed and implement the in-memory SSE Event Bus. The types define the contract between frontend and backend. The SSE bus is the real-time backbone — it receives events from API mutations and broadcasts them to all connected SSE clients scoped by project.

<requirements>
- Create `src/lib/feed-types.ts` with all interfaces: `FeedMessagePayload`, `SSEEvent`, `FeedStreamParams`, and response types
- Create `src/lib/sse-bus.ts` implementing an in-memory pub/sub event emitter
- SSE bus must scope events by `projectId` — subscribers only receive events for their project
- SSE bus must support: `subscribe(projectId, callback)`, `unsubscribe(projectId, callback)`, `publish(event: SSEEvent)`
- SSE bus must be a singleton (module-level instance) to work across API routes in the same process
- Event types must include: `message:created`, `message:updated`, `thread:reply`, `typing`, `presence`
- All types must use the existing `AuthorType` enum from Prisma
- No `any` types — everything must be strongly typed
</requirements>

## Subtasks

- [ ] 2.1 Create `src/lib/feed-types.ts` with all TypeScript interfaces and types for the feed feature
- [ ] 2.2 Create `src/lib/sse-bus.ts` with the in-memory event bus implementation
- [ ] 2.3 Export a singleton instance of the SSE bus from the module
- [ ] 2.4 Write unit tests for the SSE bus (publish, subscribe, unsubscribe, project scoping)

## Implementation Details

Refer to **techspec.md → Key Interfaces** for the type definitions and **techspec.md → Component Overview** for the SSE bus description.

Key design decisions:
- The bus is in-memory (not Redis) — acceptable for single-server deployment
- Typing and presence events are ephemeral (no DB persistence needed)
- The bus uses a `Map<string, Set<callback>>` structure keyed by `projectId`
- Callbacks receive the full `SSEEvent` object

## Success Criteria

- `feed-types.ts` exports all required interfaces matching the techspec
- `sse-bus.ts` correctly scopes events to the correct project subscribers
- Publishing to project A does not notify project B subscribers
- Unsubscribing removes the callback and prevents further event delivery
- All unit tests pass

## Task Tests

- [ ] Unit test: `publish` delivers event to all subscribers of the same projectId
- [ ] Unit test: `publish` does NOT deliver event to subscribers of a different projectId
- [ ] Unit test: `unsubscribe` removes callback and stops event delivery
- [ ] Unit test: Multiple subscribers to the same project all receive the event
- [ ] Unit test: Publishing with no subscribers does not throw
- [ ] Unit test: All SSEEvent types are accepted (message:created, message:updated, thread:reply, typing, presence)

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `src/lib/feed-types.ts` — New file (types)
- `src/lib/sse-bus.ts` — New file (event bus)
- `src/lib/types.ts` — Existing shared types (reference for patterns)
- `prisma/schema.prisma` — Reference for `AuthorType` enum
