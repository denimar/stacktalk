# Task 5.0: MessageFeed & MessageBubble Components

<critical>Read the prd.md and techspec.md files in this folder, if you do not read these files your task will be invalidated</critical>

## Overview

Build the main feed page and core message display components. This includes the `/feed` page route, the virtualized `MessageFeed` component that renders the scrollable message list, and the `MessageBubble` component that displays individual messages with author info, timestamps, role badges, and thread indicators. This is the core UI that users interact with.

<requirements>
- Create `/feed` page route (`src/app/feed/page.tsx`) with the Slack-inspired layout (center panel for feed)
- Create `MessageFeed` component (`src/components/feed/message-feed.tsx`) with virtualized scrolling for 1,000+ messages
- Create `MessageBubble` component (`src/components/feed/message-bubble.tsx`) displaying: author name, avatar, role badge (user/agent/admin), timestamp, content
- Agent-initiated messages must be visually distinguishable (subtle background tint or icon badge) per FR-1.3
- Each message with replies must show reply count and participant avatars per FR-2.3
- "New messages" indicator when user has scrolled up and new messages arrive per FR-1.5
- Infinite scroll / lazy loading for message history (scroll up to load older) per FR-1.1
- Use the `useFeedSSE` hook (from Task 4.0) to get real-time messages
- Dark and light mode support using existing CSS variables
- Install and use `react-virtuoso` for virtualized scrolling
- Follow existing component patterns: functional components, Tailwind, shadcn/ui
- Responsive layout usable on 1024px+ screens
</requirements>

## Subtasks

- [ ] 5.1 Install `react-virtuoso` package (`npm install react-virtuoso`)
- [ ] 5.2 Create `src/app/feed/page.tsx` with the feed layout (center panel)
- [ ] 5.3 Create `src/components/feed/message-feed.tsx` with virtualized message list using `react-virtuoso`
- [ ] 5.4 Create `src/components/feed/message-bubble.tsx` with author info, avatar, role badge, timestamp, content
- [ ] 5.5 Implement agent message visual distinction (subtle tint/badge)
- [ ] 5.6 Implement thread indicator on messages (reply count + participant avatars)
- [ ] 5.7 Implement "new messages" indicator when scrolled up
- [ ] 5.8 Implement infinite scroll (load older messages on scroll up)
- [ ] 5.9 Write unit tests for components

## Implementation Details

Refer to **techspec.md → MessageFeed + MessageBubble components** and **PRD → Layout (Slack-inspired)** sections.

Key implementation notes:
- Use `react-virtuoso` `Virtuoso` component with `followOutput="smooth"` to auto-scroll to new messages
- For infinite scroll up, use `startReached` callback from Virtuoso to fetch older messages via cursor
- The feed page needs a `projectId` — get it from URL params or a project selector
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Agent messages: add a subtle left border color or background tint using the agent's `color` field
- Role badges: use shadcn `Badge` component with variants for user/agent/admin
- Timestamps: use relative format ("2 min ago") with tooltip for absolute time
- Avatar: use shadcn `Avatar` component with fallback initials

## Success Criteria

- Feed page loads and displays messages from the database
- Messages render with correct author info, avatar, role badge, and timestamp
- Agent messages are visually distinct from user messages
- Scrolling up loads older messages (infinite scroll)
- New messages from SSE appear at the bottom in real-time
- "New messages" indicator appears when scrolled up and new messages arrive
- Messages with thread replies show reply count and participant avatars
- Performance: 1,000+ messages render smoothly with virtualization
- Dark/light mode works correctly
- All tests pass

## Task Tests

- [ ] Unit test: `MessageBubble` renders author name, avatar, timestamp, and content
- [ ] Unit test: `MessageBubble` shows role badge (user vs agent)
- [ ] Unit test: `MessageBubble` applies agent styling when `authorType` is "agent"
- [ ] Unit test: `MessageBubble` shows reply count and thread indicator when `replyCount > 0`
- [ ] Unit test: `MessageFeed` renders a list of messages
- [ ] Unit test: `MessageFeed` shows "new messages" indicator state
- [ ] Integration test: Feed page loads and fetches messages from API
- [ ] Integration test: New messages from SSE appear in the feed

<critical>ALWAYS CREATE AND RUN THE TASK TESTS BEFORE CONSIDERING IT COMPLETE</critical>

## Relevant Files
- `src/app/feed/page.tsx` — New file (feed page)
- `src/components/feed/message-feed.tsx` — New file (virtualized list)
- `src/components/feed/message-bubble.tsx` — New file (single message)
- `src/hooks/use-feed-sse.ts` — SSE hook (from Task 4.0)
- `src/lib/feed-types.ts` — Type definitions (from Task 2.0)
- `src/components/ui/` — shadcn/ui components (Avatar, Badge)
- `src/app/globals.css` — CSS variables for theme
