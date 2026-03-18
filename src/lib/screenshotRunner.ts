import { chromium, Browser, Page, BrowserContext } from "playwright";
import path from "path";
import fs from "fs";
import { PNG } from "pngjs";

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");
const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 3000;
const PIXEL_DIFF_THRESHOLD = 0.005;

const globalForScreenshots = globalThis as unknown as {
  __screenshotBrowser: Browser | null;
};
globalForScreenshots.__screenshotBrowser =
  globalForScreenshots.__screenshotBrowser ?? null;

async function getScreenshotBrowser(): Promise<Browser> {
  const existing = globalForScreenshots.__screenshotBrowser;
  if (existing?.isConnected()) return existing;
  const browser = await chromium.launch({ headless: true });
  globalForScreenshots.__screenshotBrowser = browser;
  return browser;
}

function ensureScreenshotsDir(): void {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

async function waitForPageStable(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function setTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  const opposite = theme === "dark" ? "light" : "dark";
  await page.evaluate(
    ({ t, o }) => {
      document.documentElement.classList.remove(o);
      document.documentElement.classList.add(t);
      localStorage.setItem("theme", t);
    },
    { t: theme, o: opposite }
  );
  await page.waitForTimeout(500);
}

async function captureToFile(url: string, filepath: string): Promise<Buffer> {
  const browser = await getScreenshotBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await waitForPageStable(page);
  const buffer = await page.screenshot({ path: filepath, fullPage: false });
  await page.close();
  await context.close();
  return buffer;
}

async function captureWithThemeOnPage(
  page: Page,
  theme: "dark" | "light",
  filepath: string
): Promise<Buffer> {
  await setTheme(page, theme);
  return page.screenshot({ path: filepath, fullPage: false });
}

export interface ThemedScreenshots {
  dark: string;
  light: string;
}

export async function captureWithThemes(
  url: string,
  baseName: string,
  onLog?: (message: string) => void
): Promise<ThemedScreenshots | null> {
  try {
    ensureScreenshotsDir();
    const darkFilename = baseName.replace(".png", "-dark.png");
    const lightFilename = baseName.replace(".png", "-light.png");
    const darkPath = path.join(SCREENSHOTS_DIR, darkFilename);
    const lightPath = path.join(SCREENSHOTS_DIR, lightFilename);
    const browser = await getScreenshotBrowser();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await waitForPageStable(page);
    onLog?.("Taking dark theme screenshot...");
    await captureWithThemeOnPage(page, "dark", darkPath);
    onLog?.("Taking light theme screenshot...");
    await captureWithThemeOnPage(page, "light", lightPath);
    await page.close();
    await context.close();
    return { dark: darkFilename, light: lightFilename };
  } catch (error) {
    onLog?.(`Theme screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function getPixelDiffRatio(bufferA: Buffer, bufferB: Buffer): number {
  try {
    const imgA = PNG.sync.read(bufferA);
    const imgB = PNG.sync.read(bufferB);
    if (imgA.width !== imgB.width || imgA.height !== imgB.height) return 1;
    const totalPixels = imgA.width * imgA.height;
    let diffPixels = 0;
    for (let i = 0; i < imgA.data.length; i += 4) {
      const rDiff = Math.abs(imgA.data[i] - imgB.data[i]);
      const gDiff = Math.abs(imgA.data[i + 1] - imgB.data[i + 1]);
      const bDiff = Math.abs(imgA.data[i + 2] - imgB.data[i + 2]);
      if (rDiff > 10 || gDiff > 10 || bDiff > 10) {
        diffPixels++;
      }
    }
    return diffPixels / totalPixels;
  } catch {
    return bufferA.equals(bufferB) ? 0 : 1;
  }
}

export async function takeScreenshot(
  url: string,
  filename: string
): Promise<string | null> {
  try {
    ensureScreenshotsDir();
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    await captureToFile(url, filepath);
    return filename;
  } catch (error) {
    console.error("Screenshot failed", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function takeAfterScreenshot(
  url: string,
  filename: string,
  beforeFilename: string,
  onLog?: (message: string) => void
): Promise<string | null> {
  try {
    ensureScreenshotsDir();
    const beforePath = path.join(SCREENSHOTS_DIR, beforeFilename);
    const beforeBuffer = fs.readFileSync(beforePath);
    const afterPath = path.join(SCREENSHOTS_DIR, filename);
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      onLog?.(`Taking after screenshot (attempt ${attempt}/${MAX_RETRIES})...`);
      const afterBuffer = await captureToFile(url, afterPath);
      const diffRatio = getPixelDiffRatio(beforeBuffer, afterBuffer);
      onLog?.(`Pixel diff: ${(diffRatio * 100).toFixed(2)}% (threshold: ${(PIXEL_DIFF_THRESHOLD * 100).toFixed(2)}%)`);
      if (diffRatio >= PIXEL_DIFF_THRESHOLD) {
        onLog?.(`Visual change detected on attempt ${attempt}.`);
        return filename;
      }
      if (attempt < MAX_RETRIES) {
        onLog?.(`No significant change yet, retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    onLog?.("No visual change detected after all retries — using last capture.");
    return filename;
  } catch (error) {
    console.error("After screenshot failed", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function getScreenshotPath(filename: string): string {
  return path.join(SCREENSHOTS_DIR, filename);
}
