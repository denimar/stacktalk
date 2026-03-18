# Task 8.0: Message Editing

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Implement inline message editing. When a user hovers over their own message, an "Edit" action appears. Clicking it transforms the message body into an inline composer. After saving, the message shows an "(edited)" indicator. Edits propagate in real-time to all connected clients via SSE.

<requirements>
- Hovering over one's own message reveals an "Edit" button (FR-6.1)
- Clicking "Edit" transforms the message body into an inline textarea (same as composer style) (FR-6.3)
- Saving the edit calls `PUT /api/feed/messages/[id]` (from Task 3.0)
- After saving, the message shows "(edited)" with a tooltip showing the edit timestamp (FR-6.2)
- Edits propagate in real-time via `message:updated` SSE event (FR-6.4)
- Users can only edit their own messages — the Edit button is hidden for other users' messages
- Pressing Esc while editing cancels the edit and restores the original content
- Pressing Enter while editing saves the edit (Shift+Enter for new lines)
- Keyboard shortcut: Ctrl+E edits the user's last message (per PRD)
- The edit must work in both the main feed and inside the thread panel
- Empty edits are prevented (cannot save empty/whitespace content)
</requirements>

## Subtasks

- [ ] 8.1 Add edit state management to `MessageBubble` (hover actions, inline edit mode)
- [ ] 8.2 Implement inline edit textarea with Enter/Shift+Enter/Esc handlers
- [ ] 8.3 Implement "(edited)" indicator with timestamp tooltip
- [ ] 8.4 Wire `editMessage` from `useFeedSSE` hook to save edits
- [ ] 8.5 Handle `message:updated` SSE events to update displayed messages in real-time
- [ ] 8.6 Implement Ctrl+E keyboard shortcut to edit last own message
- [ ] 8.7 Ensure edit works in both main feed and thread panel
- [ ] 8.8 Write unit tests for editing functionality

## Implementation Details

Refer to **techspec.md → Message editing** and **PRD → Message Editing** sections.

Key implementation notes:
- Add hover state to `MessageBubble`: show action buttons (Edit, Reply) on hover using CSS `group-hover`
- The inline edit is a `<textarea>` pre-filled with the current message content
- Use the `useFeedSSE.editMessage(messageId, content)` function to call `PUT /api/feed/messages/[id]`
- The `message:updated` SSE event handler in `useFeedSSE` should find the message in state and update its content, `isEdited`, and `editedAt` fields
- For Ctrl+E shortcut: use a `useEffect` with `keydown` listener on the document; find the last message where `authorId === currentUserId`
- The "(edited)" indicator is a small text label next to the timestamp

## Success Criteria

- Edit button appears on hover only for the user's own messages
- Clicking Edit opens inline textarea with current content
- Enter saves, Shift+Enter adds newline, Esc cancels
- After saving, "(edited)" indicator appears with correct timestamp
- Other connected clients see the edit in real-time via SSE
- Ctrl+E opens edit mode on the user's last message
- Empty edits are prevented
- Edit works in both main feed and thread panel
- All tests pass

## Task Tests

- [ ] Unit test: Edit button appears on hover for own messages only
- [ ] Unit test: Edit button is hidden for other users' messages
- [ ] Unit test: Clicking Edit opens inline textarea with current content
- [ ] Unit test: Enter saves the edit, Esc cancels
- [ ] Unit test: "(edited)" indicator appears after successful edit
- [ ] Unit test: Empty content cannot be saved
- [ ] Unit test: `message:updated` SSE event updates the message in the feed
- [ ] Integration test: Editing a message updates it in the database and broadcasts SSE event
- [ ] Integration test: Ctrl+E opens edit on the user's last message

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `src/components/feed/message-bubble.tsx` — Modified (add edit mode, from Task 5.0)
- `src/hooks/use-feed-sse.ts` — Hook providing `editMessage` (from Task 4.0)
- `src/app/api/feed/messages/[id]/route.ts` — PUT endpoint (from Task 3.0)
- `src/app/feed/page.tsx` — Feed page (may need Ctrl+E listener)
- `src/components/feed/thread-panel.tsx` — Thread panel (editing must work here too)
