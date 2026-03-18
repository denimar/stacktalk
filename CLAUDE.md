# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server at http://localhost:3000
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Architecture

This is a **Next.js 16** app using the **App Router** with React 19 and TypeScript 5.

- **Source code** lives in `src/app/` (file-based routing)
- **Path alias:** `@/*` maps to `./src/*`
- **Styling:** Tailwind CSS v4 via PostCSS, with CSS variables for dark/light themes in `src/app/globals.css`
- **Fonts:** Geist Sans and Geist Mono loaded via `next/font/google`
- **ESLint:** v9 flat config extending `next/core-web-vitals` and `next/typescript`
- **TypeScript:** strict mode enabled, target ES2017
- **UI Components:** shadcn/ui (base-nova style, neutral base color, Lucide icons). Add components via `npx shadcn@latest add <component>`. Components go to `src/components/ui/`, utilities in `src/lib/utils.ts`.

## Stacktalk

Stacktalk is a **conversational webapp builder** where AI agents turn your ideas into fully functional applications — through natural dialogue, structured task management, and real-time collaboration. It launches parallel Claude agents via Playwright browser automation against a claude.ai subscription session.

### Key modules
- `src/lib/types.ts` — Shared types (Task, Agent, AgentLog)
- `src/lib/store.ts` — In-memory task/agent store
- `src/lib/playwrightRunner.ts` — Playwright automation with persistent browser session to send prompts to claude.ai and extract responses
- `src/lib/runAgent.ts` — Agent orchestration (creates agents with different roles, runs them in parallel)
- `src/app/api/tasks/route.ts` — POST to create task + launch agents, GET to list tasks
- `src/app/api/tasks/[id]/route.ts` — GET single task with agent status
- `src/app/api/cookies/route.ts` — Check if persistent session exists
- `src/components/TaskInput.tsx` — Task description input form
- `src/components/AgentPanel.tsx` — Agent status card with logs, output, and code blocks
- `src/components/CodeViewer.tsx` — Code block renderer

### Session management
- Uses Playwright's **persistent browser context** stored in `.claude-session/`
- **First run:** browser opens in headed mode, user logs in manually, session is saved automatically
- **Subsequent runs:** browser launches headless using saved session, no login needed
- **Session reset:** delete the `.claude-session/` directory and restart
- Install Playwright browsers: `npx playwright install chromium`

## Worktree Agent Workflow (UI changes with screenshots)

When spawning an agent with `isolation: "worktree"` to make UI changes and verify them visually, the agent MUST follow this workflow:

### 1. Bootstrap the worktree
Run the setup script **from the main repo** (since the worktree clone may not have the latest version):
```bash
bash /home/denimar/projects/personal/stacktalk/scripts/worktree-setup.sh /home/denimar/projects/personal/stacktalk
```
This symlinks `node_modules`, copies `.env`, symlinks the Prisma client, and starts the dev server on **port 3099**. Wait for it to print "Server ready" before proceeding.

### 2. Make UI changes
Edit frontend files. Wait **~3s** for Next.js HMR to recompile.

### 3. Take screenshots (use `worktree-screenshot` skill)
Use MCP Playwright tools against `http://localhost:3099`:
1. **Navigate** — `mcp__playwright__browser_navigate` to the target page
2. **Auth** (if needed) — go to `/login`, fill `#login-email` with `denimar.moraes@whiteprompt.com`, fill `#login-password` with `123456789`, click `button[type="submit"]`, then navigate to the actual page
3. **Dark screenshot** — ensure dark theme via `browser_evaluate`, wait 500ms, `browser_take_screenshot`
4. **Light screenshot** — switch to light theme via `browser_evaluate`, wait 500ms, `browser_take_screenshot`
5. **CLOSE browser** — `mcp__playwright__browser_close` (ALWAYS do this)
6. **Show in chat** — use `Read` tool on the PNG paths to display screenshots

### 4. Cleanup
```bash
kill $(cat /tmp/stacktalk-worktree-dev.pid) 2>/dev/null || true
```

### Test Credentials
- Email: `denimar.moraes@whiteprompt.com`
- Password: `123456789`

### Main repo path (for worktree bootstrap)
`/home/denimar/projects/personal/stacktalk`

## VERY IMPORTANT

- **RESPONSIVENESS** the responsiveness should be mobile firstt
- **EVERY TIME** you find something important to add in this CLAUDE.md file, add it
- **EVERY TIME** you make changes on the UX/UI, use the playwright to double check the change
- **WHEN** you use Playwright, always close it after you executed a task
- **EVERY TIME** you implement frontend/UI code, you MUST use the `frontend-design` skill (`.claude/skills/frontend-design`)