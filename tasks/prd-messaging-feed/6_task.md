# Task 6.0: MessageComposer Component

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Build the message composer — the rich input area at the bottom of the feed where users type and send messages. It must support multiline input, Enter to send, Shift+Enter for new lines, and a formatting toolbar. The composer is reused in both the main feed and inside the thread panel.

<requirements>
- Create `src/components/feed/message-composer.tsx` as a reusable component
- Multiline text input: Shift+Enter for new lines, Enter to send (FR-8.1)
- Toolbar with formatting buttons: bold, italic, code, link (FR-8.2)
- Empty message prevention: Enter on empty/whitespace-only input does nothing
- The composer calls the `sendMessage` function from `useFeedSSE` hook on submit
- Accept an optional `parentMessageId` prop for thread replies
- Accept an optional `onSend` callback for additional actions after sending
- Auto-focus the input when the component mounts
- Show a subtle "sending..." state while the message is being posted
- Render markdown-style formatting on send (bold, italic, code blocks) — the content is stored as markdown text
- Use Tailwind for styling, matching the existing theme system
- The component must be under 300 lines
</requirements>

## Subtasks

- [ ] 6.1 Create `src/components/feed/message-composer.tsx` with textarea input and send logic
- [ ] 6.2 Implement Enter/Shift+Enter keyboard handling
- [ ] 6.3 Implement formatting toolbar (bold, italic, code, link buttons)
- [ ] 6.4 Implement empty message prevention
- [ ] 6.5 Add loading/sending state feedback
- [ ] 6.6 Integrate with `useFeedSSE.sendMessage` for posting
- [ ] 6.7 Write unit tests for the composer

## Implementation Details

Refer to **techspec.md → MessageComposer** and **PRD → Message Composer** sections.

Key implementation notes:
- Use a `<textarea>` with dynamic height (auto-grow) rather than a contenteditable div
- Formatting toolbar inserts markdown syntax around selected text (e.g., `**bold**`, `_italic_`, `` `code` ``)
- The toolbar uses Lucide icons: `Bold`, `Italic`, `Code`, `Link`
- Use `onKeyDown` handler to detect Enter vs Shift+Enter
- The composer accepts props: `projectId`, `parentMessageId?`, `onSend?`, `placeholder?`
- Auto-grow textarea: set `rows={1}` and adjust height via `scrollHeight` on input change
- Sending state: disable the send button and show a spinner while `sendMessage` is in-flight

## Success Criteria

- Enter sends the message, Shift+Enter inserts a new line
- Empty messages cannot be sent
- Formatting buttons insert correct markdown syntax
- Message is sent via the API and appears in the feed via SSE
- Loading state is shown while sending
- Component auto-focuses on mount
- Works in both main feed and thread panel contexts
- All tests pass

## Task Tests

- [ ] Unit test: Enter key calls `sendMessage` with the input content
- [ ] Unit test: Shift+Enter inserts a newline without sending
- [ ] Unit test: Empty/whitespace input does not trigger send
- [ ] Unit test: Send button is disabled while sending
- [ ] Unit test: Formatting buttons insert correct markdown (bold, italic, code)
- [ ] Unit test: `parentMessageId` prop is passed to `sendMessage`
- [ ] Unit test: Input clears after successful send
- [ ] Integration test: Typing and sending a message creates it via the API

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `src/components/feed/message-composer.tsx` — New file
- `src/hooks/use-feed-sse.ts` — Hook providing `sendMessage` (from Task 4.0)
- `src/lib/feed-types.ts` — Type definitions (from Task 2.0)
- `src/components/ui/button.tsx` — shadcn Button component
