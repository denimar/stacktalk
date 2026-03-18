---
name: worktree-screenshot
description: Complete workflow for worktree agents — bootstrap the project, run dev server on port 3099, take dark+light theme Playwright screenshots, and display them in chat. Use this when a worktree agent needs to verify UI changes visually.
---

This skill provides the complete end-to-end workflow for a Claude Code agent running in a **git worktree** (isolated temp folder) to bootstrap the project, run it, take screenshots, and share them.

## Prerequisites

You are running inside a git worktree (temp folder). The main repo is at:
```
/home/denimar/projects/personal/stacktalk
```

## Step 1: Bootstrap the worktree

Run this from the worktree root. Use the **main repo's copy** of the script (since the worktree clone may not have the latest version):

```bash
bash /home/denimar/projects/personal/stacktalk/scripts/worktree-setup.sh /home/denimar/projects/personal/stacktalk
```

This will:
- Symlink `node_modules` from the main repo (no npm install needed)
- Copy `.env` from the main repo
- Symlink `src/generated/prisma` from the main repo
- Start the dev server on **port 3099**
- Wait until the server is ready (up to 90s)
- Save the PID to `/tmp/stacktalk-worktree-dev.pid`

**Wait for this to complete before proceeding.** If it fails, check `/tmp/stacktalk-worktree-dev.log`.

## Step 2: Make your UI changes

Edit the frontend files as needed. After saving, wait **~3 seconds** for Next.js HMR to recompile.

## Step 3: Take screenshots with MCP Playwright

### 3a. Navigate (with auth if needed)

For pages that require authentication:

1. `mcp__playwright__browser_navigate` → `http://localhost:3099/login`
2. `mcp__playwright__browser_fill_form` with these fields:
   - selector: `#login-email`, value: `denimar.moraes@whiteprompt.com`
3. `mcp__playwright__browser_fill_form`:
   - selector: `#login-password`, value: `123456789`
4. `mcp__playwright__browser_click` → `button[type="submit"]`
5. Wait for navigation to complete
6. `mcp__playwright__browser_navigate` → `http://localhost:3099/<target-page>`

For pages that DON'T require auth (like `/login`):
1. `mcp__playwright__browser_navigate` → `http://localhost:3099/login`

### 3b. Resize viewport (optional)

`mcp__playwright__browser_resize` → width: 1440, height: 900 (desktop) or 375x812 (mobile)

### 3c. Dark theme screenshot

The app defaults to dark theme. Ensure it:

1. `mcp__playwright__browser_evaluate`:
   ```js
   document.documentElement.classList.remove('light');
   document.documentElement.classList.add('dark');
   localStorage.setItem('theme', 'dark');
   ```
2. Wait 500ms
3. `mcp__playwright__browser_take_screenshot`

### 3d. Light theme screenshot

1. `mcp__playwright__browser_evaluate`:
   ```js
   document.documentElement.classList.remove('dark');
   document.documentElement.classList.add('light');
   localStorage.setItem('theme', 'light');
   ```
2. Wait 500ms
3. `mcp__playwright__browser_take_screenshot`

### 3e. CLOSE the browser

**CRITICAL — always do this:**
`mcp__playwright__browser_close`

## Step 4: Display screenshots in chat

Use the `Read` tool on the PNG file paths returned by `browser_take_screenshot` to display them inline in the conversation.

## Step 5: Cleanup

Kill the dev server before exiting:
```bash
kill $(cat /tmp/stacktalk-worktree-dev.pid) 2>/dev/null || true
```

## Test Credentials

- Email: `denimar.moraes@whiteprompt.com`
- Password: `123456789`

## Troubleshooting

- **Server won't start:** Check `cat /tmp/stacktalk-worktree-dev.log`
- **Port 3099 busy:** `kill $(lsof -i :3099 -t) 2>/dev/null` then re-run setup
- **Prisma errors:** Ensure `src/generated/prisma` symlink points to main repo's generated client
- **Auth fails:** Re-run `npm run seed` in the main repo to reset passwords to `123456789`
