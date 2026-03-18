# Task 7.0: ThreadPanel & Typing Indicators

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Build the thread panel — a right-side slide-in panel that shows the original message and all its replies — and the typing indicator system. When a user clicks "Reply" or the thread indicator on a message, the panel slides in from the right. It reuses the `MessageBubble` and `MessageComposer` components. The typing indicator shows "User is typing..." in both the feed and threads.

<requirements>
- Create `src/components/feed/thread-panel.tsx` — right-side slide-in panel
- Panel shows the parent message at the top, followed by all thread replies
- Panel includes a `MessageComposer` at the bottom for posting thread replies
- Panel opens when user clicks a thread indicator or "Reply" button on a message
- Panel closes with Esc key or a close button (FR per PRD keyboard shortcuts)
- Thread replies load via `GET /api/feed/messages/[id]/replies` with cursor pagination
- Thread replies update in real-time via SSE `thread:reply` events
- Create `POST /api/feed/typing` endpoint that broadcasts a typing event via SSE bus
- Create `src/components/feed/typing-indicator.tsx` — "User is typing..." display
- Typing indicator is debounced (send event on keystroke, clear after 3 seconds of inactivity)
- Typing indicator works in both main feed and thread panel
- Smooth slide-in/slide-out animation for the panel
- Focus management: focus moves to panel when it opens, returns when it closes
</requirements>

## Subtasks

- [ ] 7.1 Create `src/components/feed/thread-panel.tsx` with slide-in panel layout
- [ ] 7.2 Implement thread reply loading with cursor pagination
- [ ] 7.3 Integrate `MessageBubble` for parent message and replies display
- [ ] 7.4 Integrate `MessageComposer` for posting thread replies (with `parentMessageId`)
- [ ] 7.5 Implement open/close animation and Esc key handler
- [ ] 7.6 Implement focus management on panel open/close
- [ ] 7.7 Create `src/app/api/feed/typing/route.ts` endpoint
- [ ] 7.8 Create `src/components/feed/typing-indicator.tsx` component
- [ ] 7.9 Implement typing debounce logic (3-second timeout)
- [ ] 7.10 Wire thread panel open/close state in the feed page
- [ ] 7.11 Write unit tests for thread panel and typing indicator

## Implementation Details

Refer to **techspec.md → ThreadPanel** and **PRD → Threaded Replies** sections.

Key implementation notes:
- The thread panel is absolutely/fixed positioned on the right side, overlaying the feed
- Use CSS `transform: translateX()` for the slide animation with `transition`
- The panel width should be ~400px on desktop, full-width on smaller screens
- Thread replies use the same `MessageBubble` component as the main feed
- The typing endpoint: `POST /api/feed/typing` with body `{ projectId, parentMessageId? }` — broadcasts a `typing` SSE event
- Typing debounce: in the `MessageComposer`, call the typing endpoint on first keystroke, then throttle to once per 2 seconds; the receiving end clears the indicator after 3 seconds of no typing events
- The `useFeedSSE` hook already provides `typingUsers` state (from Task 4.0)

## Success Criteria

- Clicking a thread indicator opens the panel with the parent message and replies
- Thread replies load correctly with pagination
- New thread replies appear in real-time via SSE
- The composer at the bottom creates thread replies (not main feed messages)
- Esc key closes the panel
- Panel has smooth slide-in/out animation
- Typing indicator shows when another user is typing
- Typing indicator disappears after 3 seconds of inactivity
- Focus management works correctly
- All tests pass

## Task Tests

- [ ] Unit test: `ThreadPanel` renders parent message and replies
- [ ] Unit test: `ThreadPanel` includes a `MessageComposer` with correct `parentMessageId`
- [ ] Unit test: `ThreadPanel` close button and Esc key trigger close callback
- [ ] Unit test: `TypingIndicator` displays user name when typing
- [ ] Unit test: `TypingIndicator` hides after timeout
- [ ] Unit test: Typing API endpoint broadcasts typing SSE event
- [ ] Integration test: Opening thread panel fetches replies from the API
- [ ] Integration test: Posting a reply in the thread panel appears in the thread via SSE

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `src/components/feed/thread-panel.tsx` — New file
- `src/components/feed/typing-indicator.tsx` — New file
- `src/app/api/feed/typing/route.ts` — New file
- `src/components/feed/message-bubble.tsx` — Reused (from Task 5.0)
- `src/components/feed/message-composer.tsx` — Reused (from Task 6.0)
- `src/hooks/use-feed-sse.ts` — SSE hook (from Task 4.0)
- `src/app/feed/page.tsx` — Feed page (from Task 5.0, updated for thread panel state)
