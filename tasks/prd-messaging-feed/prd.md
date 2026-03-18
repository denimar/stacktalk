# Product Requirements Document (PRD) — Messaging Feed

## Overview

Stacktalk needs a primary messaging interface — similar in look and feel to Slack — where users and AI agents collaborate in real time. This screen replaces the current interaction model with a rich, threaded conversation feed that supports file attachments, voice messages, @mentions, and autonomous agent participation. The goal is to make building applications feel like a team conversation where humans and agents work side by side.

## Objectives

- **Primary collaboration hub**: Serve as the main screen users interact with when building apps in Stacktalk
- **Human + Agent parity**: Both users and agents post, reply, share files, and initiate conversations in the same feed
- **Real-time experience**: All messages, thread replies, and status updates appear instantly without page refresh
- **Key metrics**:
  - Time-to-first-message < 2 seconds after page load
  - Message delivery latency < 500 ms (perceived)
  - User engagement: average thread depth, messages per session
  - Attachment upload success rate > 99%

## User Stories

### Users (from `users` table)

1. As a **user**, I want to post a message in the main feed so that agents and teammates can see my request
2. As a **user**, I want to reply inside a thread so that the conversation stays organized
3. As a **user**, I want to @mention another user or agent in a message so that they are notified and can respond
4. As a **user**, I want to attach files (images, PDFs, DOCX, TXT) or paste images from the clipboard so that I can share context visually
5. As a **user**, I want to record and send a voice message so that I can communicate quickly without typing
6. As a **user**, I want to edit my own messages so that I can correct mistakes
7. As an **admin/owner**, I want to see all messages from every user so that I can oversee the project

### Agents (from `agents` table)

8. As an **agent**, I want to initiate a message in the main feed (e.g., a Security Specialist flagging a vulnerability) so that users are proactively informed
9. As an **agent**, I want to reply in a thread sharing my work — including source references, preview screens, and design assets — so that users can review my output in context

## Core Features

### 1. Main Message Feed

A single, chronological feed displaying all top-level messages for a project.

- **Why**: Centralizes all communication between users and agents in one place
- **How it works**: Messages appear in reverse-chronological order (newest at bottom). Each message shows the author (user or agent), avatar, timestamp, and content. Scrolling up loads older messages.
- **Functional requirements**:
  - FR-1.1: Display messages in chronological order with infinite scroll / lazy loading for history
  - FR-1.2: Each message must show: author name, avatar, role badge (user/agent/admin), timestamp
  - FR-1.3: Agent-initiated messages must be visually distinguishable (e.g., subtle background tint or icon badge)
  - FR-1.4: New messages appear at the bottom in real time without user action
  - FR-1.5: A "new messages" indicator must appear when the user has scrolled up and new messages arrive

### 2. Threaded Replies

Any message in the main feed can have a thread of replies.

- **Why**: Keeps detailed discussions and agent work organized without cluttering the main feed
- **How it works**: Clicking "Reply" or a thread indicator on a message opens a right-side panel showing the original message and all replies. Thread replies do not appear in the main feed, but a reply count and last-reply preview are shown on the parent message.
- **Functional requirements**:
  - FR-2.1: Any user or agent can open a thread on any message
  - FR-2.2: Thread panel opens on the right side of the screen (Slack-style)
  - FR-2.3: Parent message in the main feed must show reply count and avatars of participants
  - FR-2.4: Thread replies update in real time
  - FR-2.5: Users can post text, files, voice messages, and mentions inside threads

### 3. @Mentions

Tag users or agents to draw their attention.

- **Why**: Enables directed communication and triggers notifications
- **How it works**: Typing `@` in the composer opens an autocomplete dropdown listing users and agents. Selecting one inserts a styled mention chip.
- **Functional requirements**:
  - FR-3.1: `@` trigger opens a filterable autocomplete with users and agents from the database
  - FR-3.2: Mentions render as highlighted chips in the message body
  - FR-3.3: Mentioned users/agents receive a notification (in-app at minimum)
  - FR-3.4: Clicking a mention chip shows a profile popover (name, role, status)

### 4. File Attachments

Attach documents and images to messages.

- **Why**: Users need to share screenshots, designs, specs, and documents for context
- **How it works**: The message composer includes an attachment button and supports drag-and-drop and clipboard paste. Supported types: images (PNG, JPG, GIF, WebP, SVG), PDF, DOC, DOCX, TXT.
- **Functional requirements**:
  - FR-4.1: Upload via button, drag-and-drop onto the composer, or Ctrl/Cmd+V clipboard paste
  - FR-4.2: Images display as inline previews (thumbnails) within the message; clicking opens a lightbox
  - FR-4.3: Documents (PDF, DOC, DOCX, TXT) display as downloadable cards with file name, type icon, and size
  - FR-4.4: Multiple attachments per message are supported
  - FR-4.5: Upload progress indicator shown during upload
  - FR-4.6: Reasonable file size limit (configurable, default 25 MB per file)

### 5. Voice Messages

Record and send audio messages.

- **Why**: Enables faster, richer communication without typing
- **How it works**: A microphone button in the composer starts recording. The user can preview, cancel, or send the recording. Voice messages display as an inline audio player in the message.
- **Functional requirements**:
  - FR-5.1: Record via microphone button in the message composer
  - FR-5.2: Show recording duration and waveform visualization while recording
  - FR-5.3: Allow preview, cancel, or send before posting
  - FR-5.4: Voice messages render as an inline audio player with play/pause, duration, and waveform
  - FR-5.5: Request microphone permission gracefully with clear user prompt

### 6. Message Editing

Edit previously sent messages.

- **Why**: Users need to correct typos or update information after posting
- **How it works**: Hovering over one's own message reveals an "Edit" action. The message body becomes editable inline. An "(edited)" label is shown after saving.
- **Functional requirements**:
  - FR-6.1: Users can edit their own messages (not other users' messages)
  - FR-6.2: Edited messages display an "(edited)" indicator with timestamp
  - FR-6.3: Edit is inline — the message body transforms into the composer
  - FR-6.4: Edits propagate in real time to all connected clients

### 7. Real-Time Communication

All feed and thread activity must be live.

- **Why**: A collaborative workspace requires instant feedback; polling creates a laggy experience
- **Functional requirements**:
  - FR-7.1: New messages, thread replies, edits, and typing indicators appear in real time
  - FR-7.2: Online/offline presence indicators for users
  - FR-7.3: Typing indicator ("User is typing...") in both feed and threads
  - FR-7.4: Graceful reconnection on network interruption with queued message delivery

### 8. Message Composer

A rich input area at the bottom of the feed and inside threads.

- **Functional requirements**:
  - FR-8.1: Multiline text input with Shift+Enter for new lines, Enter to send
  - FR-8.2: Toolbar with: attach file, record voice, emoji picker, and formatting (bold, italic, code, link)
  - FR-8.3: Rich text preview (markdown-style formatting rendered on send)
  - FR-8.4: Paste image from clipboard directly into the composer

### 9. Admin/Owner Visibility

- **Functional requirements**:
  - FR-9.1: Users with admin or owner role can view all messages across all users in the project
  - FR-9.2: Role-based visibility is enforced server-side

## User Experience

### Layout (Slack-inspired)

- **Left sidebar** (optional/collapsible): Project info, user/agent list, navigation
- **Center panel**: Main message feed with composer at the bottom
- **Right panel** (slides in): Thread view when a thread is opened
- **Top bar**: Project name, search (future), settings

### User Flow

1. User lands on the messaging screen (center panel with feed)
2. Types a message in the composer at the bottom and sends it
3. An agent (or another user) replies — user sees a thread indicator on the message
4. User clicks the thread indicator — right panel slides open showing the thread
5. User @mentions an agent in the thread — autocomplete appears, agent is notified
6. Agent responds in the thread with a design preview image and explanation
7. User records a voice message to give quick feedback

### UI/UX Considerations

- Dark and light mode support (following existing Stacktalk theme system)
- Agent messages should be visually distinct but not disruptive (subtle icon or color accent)
- Smooth animations for thread panel open/close, new message appearance, and typing indicators
- Responsive: usable on tablet-width screens (1024px+), graceful degradation on mobile
- Keyboard shortcuts: Enter to send, Esc to close thread panel, Ctrl+E to edit last message

### Accessibility

- Standard WCAG 2.1 AA compliance
- Keyboard navigable: all actions reachable without a mouse
- Screen reader labels on interactive elements (buttons, composer, thread panel)
- Focus management when thread panel opens/closes

## High-Level Technical Constraints

- **Database**: Messages, threads, and attachments must be persisted (existing database)
- **Tables involved**: `users`, `agents` (existing); new tables for messages, threads, attachments
- **Real-time**: Requires WebSocket or SSE infrastructure for live updates
- **File storage**: Attachments need a storage solution (local filesystem or object storage)
- **Audio recording**: Browser MediaRecorder API required; audio encoded as WebM or MP3
- **Performance**: Feed must handle 1,000+ messages per project with virtualized scrolling
- **Security**: File uploads must be validated server-side (type, size); messages sanitized to prevent XSS

## Out of Scope

- **Video/audio calls**: Not included in this version
- **Message deletion**: Not included (editing is sufficient for v1)
- **Emoji reactions**: Not included in v1 (candidate for future iteration)
- **Message search**: Not included in v1
- **Direct messages (DMs)**: Not included; all messaging is project-scoped
- **Channel/room system**: Single feed per project; no multiple channels
- **Push notifications**: In-app notifications only; no email/mobile push
- **Agent implementation**: The `agents` table and agent behavior are separate from this PRD; this document defines how agents interact with the messaging UI
