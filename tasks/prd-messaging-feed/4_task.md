# Task 4.0: SSE Stream Endpoint + useFeedSSE Hook

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Implement the Server-Sent Events (SSE) stream endpoint and the React hook that consumes it. The SSE endpoint is a long-lived HTTP connection that pushes real-time events (new messages, edits, thread replies, typing indicators) to connected clients. The `useFeedSSE` hook manages the `EventSource` lifecycle, reconnection, and dispatches events to local React state.

<requirements>
- `GET /api/feed/stream?projectId=X` — SSE endpoint that streams events to the client
- SSE endpoint must validate `session_user_id` cookie before establishing the stream
- SSE endpoint must subscribe to the SSE bus for the given `projectId` and write events as SSE-formatted data
- SSE endpoint must support reconnection via `Last-Event-ID` header (each event includes an incrementing ID)
- SSE endpoint must send a heartbeat (`:ping`) every 30 seconds to keep the connection alive
- SSE endpoint must clean up (unsubscribe from bus) when the client disconnects
- `useFeedSSE(projectId)` hook must manage an `EventSource` connection to `/api/feed/stream`
- Hook must handle reconnection on disconnect (with exponential backoff)
- Hook must expose: `messages`, `threadMessages`, `typingUsers`, `isConnected`, `sendMessage`, `editMessage`
- Hook must merge incoming SSE events into local state (optimistic updates for sent messages)
- Use Next.js App Router streaming response (Web Streams API) for the SSE endpoint
</requirements>

## Subtasks

- [ ] 4.1 Create `src/app/api/feed/stream/route.ts` with SSE streaming using Web Streams API
- [ ] 4.2 Implement session authentication for the SSE endpoint
- [ ] 4.3 Implement heartbeat mechanism (`:ping` every 30 seconds)
- [ ] 4.4 Implement `Last-Event-ID` support for reconnection
- [ ] 4.5 Create `src/hooks/use-feed-sse.ts` with EventSource management and state handling
- [ ] 4.6 Implement reconnection with exponential backoff in the hook
- [ ] 4.7 Write unit tests for the SSE endpoint and the hook

## Implementation Details

Refer to **techspec.md → SSE Stream Route** and **techspec.md → useFeedSSE hook** sections.

Key implementation notes:
- Use `ReadableStream` with a `TransformStream` for the SSE response in Next.js App Router
- Set response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- SSE event format: `id: {eventId}\nevent: {eventType}\ndata: {jsonPayload}\n\n`
- The hook should use `useRef` for the EventSource to avoid re-creating on every render
- Use `useEffect` cleanup to close the EventSource on unmount
- Exponential backoff: start at 1s, max 30s, reset on successful connection
- The `sendMessage` and `editMessage` functions in the hook call the REST API (POST/PUT) — they don't go through SSE

## Success Criteria

- SSE endpoint streams events to connected clients in real-time
- Unauthenticated SSE requests return 401
- Heartbeat keeps connection alive across proxy timeouts
- Client reconnects automatically after disconnection
- `Last-Event-ID` allows catching up on missed events
- Hook correctly updates local state for all event types
- Hook exposes correct `isConnected` status
- All tests pass

## Task Tests

- [ ] Unit test: SSE endpoint returns proper headers (Content-Type, Cache-Control)
- [ ] Unit test: SSE endpoint returns 401 for unauthenticated requests
- [ ] Unit test: SSE endpoint formats events correctly (id, event, data fields)
- [ ] Unit test: `useFeedSSE` hook initializes EventSource with correct URL
- [ ] Unit test: `useFeedSSE` hook updates `messages` state on `message:created` event
- [ ] Unit test: `useFeedSSE` hook updates messages on `message:updated` event
- [ ] Unit test: `useFeedSSE` hook updates `threadMessages` on `thread:reply` event
- [ ] Unit test: `useFeedSSE` hook updates `typingUsers` on `typing` event
- [ ] Unit test: `useFeedSSE` hook sets `isConnected` to false on disconnect
- [ ] Integration test: Full flow — publish event to SSE bus → verify SSE stream delivers it

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `src/app/api/feed/stream/route.ts` — New file (SSE endpoint)
- `src/hooks/use-feed-sse.ts` — New file (React hook)
- `src/lib/sse-bus.ts` — Event bus (from Task 2.0)
- `src/lib/feed-types.ts` — Type definitions (from Task 2.0)
