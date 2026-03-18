import { chromium, BrowserContext, Page } from "playwright";
import path from "path";
import fs from "fs";

const CLAUDE_URL = "https://claude.ai/new";
const RESPONSE_TIMEOUT = 120_000; // 2 minutes
const LOGIN_TIMEOUT = 120_000; // 2 minutes for manual login
const SESSION_DIR = path.join(process.cwd(), ".claude-session");

export interface RunnerCallbacks {
  onLog: (message: string) => void;
  onComplete: (response: string) => void;
  onError: (error: string) => void;
}

function extractCodeBlocks(text: string): string[] {
  const regex = /```[\w]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

// Shared persistent context — lazily initialized, reused across agents
let sharedContext: BrowserContext | null = null;
let contextInitPromise: Promise<BrowserContext> | null = null;

async function getOrCreateContext(): Promise<BrowserContext> {
  if (sharedContext) {
    // Verify the context is still alive
    try {
      await sharedContext.pages();
    } catch {
      console.log("[Session] Browser context disconnected. Recreating...");
      sharedContext = null;
    }
  }
  if (sharedContext) return sharedContext;
  if (contextInitPromise) return contextInitPromise;

  contextInitPromise = initPersistentContext();
  sharedContext = await contextInitPromise;
  contextInitPromise = null;
  return sharedContext;
}

async function initPersistentContext(): Promise<BrowserContext> {
  const isFirstRun = !fs.existsSync(SESSION_DIR);

  if (isFirstRun) {
    console.log("[Session] No session directory found. First-time setup required.");
    console.log(`[Session] Session will be saved to: ${SESSION_DIR}`);
  } else {
    console.log(`[Session] Using existing session directory: ${SESSION_DIR}`);
  }

  console.log("[Session] Launching persistent browser...");

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: !isFirstRun,
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  // Verify login on startup
  const page = await context.newPage();
  await page.goto(CLAUDE_URL, { waitUntil: "networkidle", timeout: 30_000 });

  const loggedIn = await checkLoggedIn(page);

  if (!loggedIn) {
    if (isFirstRun) {
      console.log("[Session] Please log in to Claude in the opened browser...");
      console.log("[Session] Waiting for login (up to 2 minutes)...");
    } else {
      console.log("[Session] Session expired. Please log in again in the opened browser...");
      // Relaunch in headed mode if we were headless
      await page.close();
      await context.close();
      sharedContext = null;

      const headedContext = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: false,
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 },
      });
      const headedPage = await headedContext.newPage();
      await headedPage.goto(CLAUDE_URL, { waitUntil: "networkidle", timeout: 30_000 });
      await waitForLogin(headedPage);
      await headedPage.close();
      console.log("[Session] Session restored successfully.");
      return headedContext;
    }

    await waitForLogin(page);
  }

  await page.close();
  console.log("[Session] Session loaded successfully.");
  return context;
}

async function checkLoggedIn(page: Page): Promise<boolean> {
  return page
    .waitForSelector('[contenteditable="true"], textarea, div[role="textbox"]', {
      timeout: 10_000,
    })
    .then(() => true)
    .catch(() => false);
}

async function waitForLogin(page: Page): Promise<void> {
  const loggedIn = await page
    .waitForSelector('[contenteditable="true"], textarea, div[role="textbox"]', {
      timeout: LOGIN_TIMEOUT,
    })
    .then(() => true)
    .catch(() => false);

  if (!loggedIn) {
    throw new Error(
      "Login timed out. Please try again. If the problem persists, delete the .claude-session directory and restart."
    );
  }

  console.log("[Session] Login detected. Session saved automatically.");
}

export function sessionExists(): boolean {
  return fs.existsSync(SESSION_DIR);
}

export async function runPlaywrightAgent(
  prompt: string,
  callbacks: RunnerCallbacks
): Promise<{ response: string; codeBlocks: string[] }> {
  let page: Page | null = null;

  try {
    callbacks.onLog("Launching persistent browser...");
    const context = await getOrCreateContext();

    callbacks.onLog("Opening new page...");
    page = await context.newPage();

    callbacks.onLog("Navigating to claude.ai...");
    await page.goto(CLAUDE_URL, { waitUntil: "networkidle", timeout: 30_000 });

    // Check if we're logged in
    callbacks.onLog("Checking authentication...");
    const isLoggedIn = await checkLoggedIn(page);

    if (!isLoggedIn) {
      throw new Error(
        "Authentication failed — session may have expired. Delete .claude-session and restart."
      );
    }

    callbacks.onLog("Authenticated. Sending prompt...");

    // Find and fill the input
    const inputSelector =
      'div[contenteditable="true"], textarea, div[role="textbox"]';
    const input = await page.waitForSelector(inputSelector, { timeout: 10_000 });

    if (!input) {
      throw new Error("Could not find chat input element");
    }

    // Paste the prompt via clipboard (typing is unreliable on contenteditable)
    await input.click();
    await page.evaluate(
      (text) => {
        const dt = new DataTransfer();
        dt.setData("text/plain", text);
        const pasteEvent = new ClipboardEvent("paste", {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        });
        document.activeElement?.dispatchEvent(pasteEvent);
      },
      prompt
    );

    // Small delay to let the UI process the paste
    await page.waitForTimeout(500);

    // Submit
    callbacks.onLog("Submitting prompt...");
    await page.keyboard.press("Enter");

    // Wait for response to start appearing
    callbacks.onLog("Waiting for Claude's response...");

    // Wait for streaming to finish using content stabilization
    await waitForResponseComplete(page, callbacks);

    // Extract the response text
    callbacks.onLog("Extracting response...");
    const responseText = await extractResponse(page);

    if (!responseText) {
      throw new Error("Could not extract response from Claude");
    }

    const codeBlocks = extractCodeBlocks(responseText);
    callbacks.onLog(
      `Completed. Extracted ${codeBlocks.length} code block(s).`
    );
    callbacks.onComplete(responseText);

    // Close the page but keep the context alive
    await page.close();

    return { response: responseText, codeBlocks };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    callbacks.onError(message);
    if (page) {
      try {
        await page.close();
      } catch {
        // ignore cleanup errors
      }
    }
    throw error;
  }
}

async function waitForResponseComplete(
  page: Page,
  callbacks: RunnerCallbacks
): Promise<void> {
  const startTime = Date.now();
  let lastContentLength = 0;
  let stableChecks = 0;
  const STABLE_THRESHOLD = 4; // 4 consecutive checks with same content = done
  const CHECK_INTERVAL = 3000; // check every 3 seconds

  // Wait for initial content to appear
  await page.waitForTimeout(5000);

  while (Date.now() - startTime < RESPONSE_TIMEOUT) {
    const status = await page
      .evaluate(() => {
        // Check if still streaming via data attribute
        const streamEl = document.querySelector("[data-is-streaming]");
        if (
          streamEl &&
          streamEl.getAttribute("data-is-streaming") === "true"
        ) {
          return { streaming: true, contentLength: 0 };
        }

        // Check for stop/cancel buttons (broad matching)
        const allButtons = document.querySelectorAll("button");
        for (const btn of allButtons) {
          const label = (
            btn.getAttribute("aria-label") ||
            btn.textContent ||
            ""
          ).toLowerCase();
          // Only match visible buttons
          if (
            (label.includes("stop") || label.includes("cancel response")) &&
            btn.offsetParent !== null
          ) {
            return { streaming: true, contentLength: 0 };
          }
        }

        // Measure total content length on page for stabilization
        const bodyText = document.body.innerText || "";
        return { streaming: false, contentLength: bodyText.length };
      })
      .catch(() => ({ streaming: false, contentLength: 0 }));

    if (status.streaming) {
      stableChecks = 0;
      callbacks.onLog("Still streaming...");
      await page.waitForTimeout(CHECK_INTERVAL);
      continue;
    }

    // Content stabilization: if length hasn't changed, response is likely done
    if (
      status.contentLength > 0 &&
      status.contentLength === lastContentLength
    ) {
      stableChecks++;
      if (stableChecks >= STABLE_THRESHOLD) {
        callbacks.onLog("Response complete.");
        return;
      }
    } else {
      stableChecks = 0;
    }

    lastContentLength = status.contentLength;
    await page.waitForTimeout(CHECK_INTERVAL);
  }

  callbacks.onLog("Response timed out — extracting partial response.");
}

async function extractResponse(page: Page): Promise<string> {
  const response = await page.evaluate(() => {
    /**
     * Convert Claude's rendered HTML response back to markdown-like text.
     * This preserves code blocks with file path headers so the file parser can work.
     */
    function htmlToMarkdown(el: Element): string {
      const parts: string[] = [];

      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          parts.push(child.textContent || "");
          continue;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const elem = child as Element;
        const tag = elem.tagName.toLowerCase();

        // Skip script/style
        if (tag === "script" || tag === "style") continue;

        // Code blocks (pre > code) — also handle wrapper divs around pre
        if (tag === "pre" || (elem.querySelector("pre") && !elem.querySelector("p"))) {
          const pre = tag === "pre" ? elem : elem.querySelector("pre")!;
          const code = pre.querySelector("code");
          const codeText = code?.textContent || pre.textContent || "";
          const langClass = code?.className?.match(/language-(\w+)/);
          const lang = langClass ? langClass[1] : "";
          parts.push(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
          continue;
        }

        // Inline code
        if (tag === "code") {
          parts.push(`\`${elem.textContent || ""}\``);
          continue;
        }

        // Bold — recurse to preserve nested formatting
        if (tag === "strong" || tag === "b") {
          const inner = htmlToMarkdown(elem);
          parts.push(`**${inner}**`);
          continue;
        }

        // Headings
        if (/^h[1-6]$/.test(tag)) {
          const level = parseInt(tag[1]);
          const inner = htmlToMarkdown(elem);
          parts.push(`\n${"#".repeat(level)} ${inner}\n`);
          continue;
        }

        // Paragraphs
        if (tag === "p") {
          parts.push(`\n${htmlToMarkdown(elem)}\n`);
          continue;
        }

        // List items
        if (tag === "li") {
          parts.push(`\n- ${htmlToMarkdown(elem)}`);
          continue;
        }

        // Recurse for other elements
        parts.push(htmlToMarkdown(elem));
      }

      return parts.join("");
    }

    // ── Strategy 1: Find ALL assistant message blocks and convert them ──
    // Try multiple selectors for message containers
    const messageSelectors = [
      '[class*="claude-response"]',
      '[data-testid="chat-message-content"]',
      ".prose",
      '[class*="message-content"]',
      '[class*="MessageContent"]',
      '[class*="standard-markdown"]',
    ];

    let messageElements: Element[] = [];
    for (const selector of messageSelectors) {
      const els = document.querySelectorAll(selector);
      if (els.length > 0) {
        messageElements = Array.from(els);
        break;
      }
    }

    // Filter to only assistant responses by excluding user message containers
    // Claude.ai uses "claude-response" class only on assistant messages
    // For other selectors, take the last element(s) as they're most likely the response
    const assistantMessages = messageElements;

    const responseParts: string[] = [];

    for (const msgEl of assistantMessages) {
      const md = htmlToMarkdown(msgEl);
      if (md.trim().length > 0) {
        responseParts.push(md);
      }
    }

    // ── Strategy 2: Independently find ALL <pre> code blocks on the page ──
    // These might be in artifacts, canvas, or other containers we missed
    const allPreElements = document.querySelectorAll("pre");
    const capturedCodeTexts = new Set<string>();

    // Track which pre elements were already captured in strategy 1
    for (const msgEl of assistantMessages) {
      const pres = msgEl.querySelectorAll("pre");
      for (const pre of pres) {
        capturedCodeTexts.add((pre.textContent || "").trim());
      }
    }

    for (const pre of allPreElements) {
      const code = pre.querySelector("code");
      const codeText = (code?.textContent || pre.textContent || "").trim();

      // Skip if already captured or too short
      if (capturedCodeTexts.has(codeText) || codeText.length < 50) continue;
      capturedCodeTexts.add(codeText);

      const langClass = code?.className?.match(/language-(\w+)/);
      const lang = langClass ? langClass[1] : "";

      // Try to find a file name/title associated with this code block
      // Look in parent containers and siblings for filename references
      let fileName = "";

      // Method 1: Look in parent containers for title/filename elements
      let container = pre.parentElement;
      for (let i = 0; i < 6 && container && !fileName; i++) {
        const titleEls = container.querySelectorAll(
          '[class*="title"], [class*="filename"], [class*="name"], [class*="header"] span, [class*="tab"] span, button span, [class*="label"]'
        );
        for (const titleEl of titleEls) {
          const titleText = titleEl.textContent?.trim() || "";
          if (titleText.includes(".") && /^[\w./\-]+$/.test(titleText) && titleText.includes("/")) {
            fileName = titleText;
            break;
          }
        }
        container = container.parentElement;
      }

      // Method 2: Check the previous sibling elements for file path text
      if (!fileName) {
        let sibling = pre.parentElement;
        while (sibling && !fileName) {
          const prev = sibling.previousElementSibling;
          if (prev) {
            const text = prev.textContent?.trim() || "";
            const pathMatch = text.match(/([\w./\-]+\/[\w.\-]+\.\w+)/);
            if (pathMatch) {
              fileName = pathMatch[1];
            }
          }
          sibling = sibling.parentElement;
        }
      }

      if (fileName) {
        responseParts.push(`\n**\`${fileName}\`**\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
      } else {
        responseParts.push(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
      }
    }

    if (responseParts.length > 0) {
      return responseParts.join("\n");
    }

    // ── Fallback: get longest text block on the page ──
    const allDivs = document.querySelectorAll("div");
    let longest = "";
    for (const div of allDivs) {
      const text = div.textContent || "";
      if (text.length > longest.length && text.length > 100) {
        longest = text;
      }
    }
    return longest;
  });

  console.log(`[extractResponse] Extracted ${response.length} chars`);
  return response.trim();
}
