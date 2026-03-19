import { execFile, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import net from "net";

const exec = promisify(execFile);

const BASE_CLONE_DIR = path.join(process.cwd(), ".agent-repos");

export interface PreparedRepo {
  dir: string;
  devUrl: string;
  devProcess: ChildProcess;
}

const clonedProjects = new Map<string, PreparedRepo>();

function getRepoDirName(gitRepository: string): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  const repoName = gitRepository
    .replace(/\.git$/, "")
    .split("/")
    .pop() || "repo";
  return `${repoName}-${timestamp}-${randomSuffix}`;
}

function getRepoLocalPath(gitRepository: string): string {
  return path.join(BASE_CLONE_DIR, getRepoDirName(gitRepository));
}

function toSshUrl(gitRepository: string): string {
  if (gitRepository.startsWith("git@")) {
    return gitRepository;
  }
  const cleaned = gitRepository.replace(/^https?:\/\//, "").replace(/\.git$/, "");
  const [host, ...rest] = cleaned.split("/");
  return `git@${host}:${rest.join("/")}.git`;
}

function toHttpsUrl(gitRepository: string): string {
  if (gitRepository.startsWith("https://")) {
    return gitRepository;
  }
  if (gitRepository.startsWith("git@")) {
    return gitRepository.replace(/^git@([^:]+):(.+)$/, "https://$1/$2");
  }
  return `https://${gitRepository}`;
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("Failed to get free port")));
      }
    });
    server.on("error", reject);
  });
}

async function detectPackageManager(targetDir: string): Promise<"pnpm" | "yarn" | "npm"> {
  try {
    await fs.access(path.join(targetDir, "pnpm-lock.yaml"));
    return "pnpm";
  } catch {}
  try {
    await fs.access(path.join(targetDir, "yarn.lock"));
    return "yarn";
  } catch {}
  return "npm";
}

async function installDependencies(targetDir: string): Promise<void> {
  const pm = await detectPackageManager(targetDir);
  console.log(`[GitRepoManager] Installing dependencies with ${pm}...`);
  try {
    await exec(pm, ["install"], {
      cwd: targetDir,
      timeout: 300_000,
    });
    console.log(`[GitRepoManager] Dependencies installed successfully`);
  } catch (error) {
    console.error("[GitRepoManager] Failed to install dependencies", {
      targetDir,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function generatePrismaClient(targetDir: string): Promise<void> {
  try {
    await fs.access(path.join(targetDir, "prisma", "schema.prisma"));
  } catch {
    console.log("[GitRepoManager] No Prisma schema found, skipping generate");
    return;
  }
  console.log("[GitRepoManager] Generating Prisma client...");
  try {
    await exec("npx", ["prisma", "generate"], {
      cwd: targetDir,
      timeout: 120_000,
    });
    console.log("[GitRepoManager] Prisma client generated successfully");
  } catch (error) {
    console.error("[GitRepoManager] Failed to generate Prisma client", {
      targetDir,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function buildProject(targetDir: string): Promise<void> {
  const pm = await detectPackageManager(targetDir);
  console.log(`[GitRepoManager] Building project with ${pm}...`);
  try {
    await exec(pm, ["run", "build"], {
      cwd: targetDir,
      timeout: 300_000,
    });
    console.log(`[GitRepoManager] Build completed successfully`);
  } catch (error) {
    console.error("[GitRepoManager] Failed to build project", {
      targetDir,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function startDevServer(targetDir: string, port: number): Promise<ChildProcess> {
  console.log(`[GitRepoManager] Starting dev server on port ${port}...`);
  const child = spawn("npx", ["next", "start", "--port", String(port)], {
    cwd: targetDir,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, PORT: String(port) },
  });
  child.unref();
  let stderr = "";
  child.stdout?.on("data", (data: Buffer) => {
    console.log(`[GitRepoManager:dev:${port}] ${data.toString().trim()}`);
  });
  child.stderr?.on("data", (data: Buffer) => {
    stderr += data.toString();
    console.error(`[GitRepoManager:dev:${port}] ${data.toString().trim()}`);
  });
  child.on("error", (error) => {
    console.error(`[GitRepoManager] Dev server process error on port ${port}`, {
      error: error.message,
    });
  });
  child.on("exit", (code, signal) => {
    console.log(`[GitRepoManager] Dev server on port ${port} exited`, { code, signal });
  });
  const url = `http://localhost:${port}`;
  const timeoutMs = 90_000;
  const pollInterval = 2_000;
  let elapsed = 0;
  console.log(`[GitRepoManager] Waiting for server at ${url} (max ${timeoutMs / 1000}s)...`);
  while (elapsed < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 400) {
        console.log(`[GitRepoManager] Dev server ready at ${url} (${elapsed / 1000}s)`);
        return child;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    elapsed += pollInterval;
  }
  child.kill();
  console.error("[GitRepoManager] Dev server failed to start", {
    port,
    targetDir,
    stderr: stderr.slice(-500),
  });
  throw new Error(`Dev server did not become ready within ${timeoutMs / 1000}s on port ${port}`);
}

async function cloneRepo(gitRepository: string, targetDir: string): Promise<void> {
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  const sshUrl = toSshUrl(gitRepository);
  console.log(`[GitRepoManager] Cloning ${sshUrl} to ${targetDir}`);
  try {
    await exec("git", ["clone", "--depth", "1", sshUrl, targetDir], {
      timeout: 120_000,
    });
  } catch (sshError) {
    console.error("[GitRepoManager] SSH clone failed", {
      sshUrl,
      error: sshError instanceof Error ? sshError.message : String(sshError),
    });
    const httpsUrl = toHttpsUrl(gitRepository);
    console.log(`[GitRepoManager] Falling back to HTTPS: ${httpsUrl}`);
    try {
      await exec("git", ["clone", "--depth", "1", httpsUrl, targetDir], {
        timeout: 120_000,
      });
    } catch (httpsError) {
      console.error("[GitRepoManager] HTTPS clone also failed", {
        httpsUrl,
        error: httpsError instanceof Error ? httpsError.message : String(httpsError),
      });
      throw httpsError;
    }
  }
  console.log(`[GitRepoManager] Clone completed: ${targetDir}`);
}

export async function prepareProjectRepo(gitRepository: string): Promise<PreparedRepo> {
  if (!gitRepository) {
    throw new Error("Git repository URL is required");
  }
  const repoDir = getRepoLocalPath(gitRepository);
  console.log(`[GitRepoManager] Base clone dir: ${BASE_CLONE_DIR}`);
  console.log(`[GitRepoManager] Creating fresh clone at: ${repoDir}`);
  try {
    await cloneRepo(gitRepository, repoDir);
    await installDependencies(repoDir);
    await generatePrismaClient(repoDir);
    await buildProject(repoDir);
    const port = await findFreePort();
    const devProcess = await startDevServer(repoDir, port);
    const devUrl = `http://localhost:${port}`;
    const result: PreparedRepo = { dir: repoDir, devUrl, devProcess };
    clonedProjects.set(gitRepository, result);
    console.log(`[GitRepoManager] Repo ready at: ${repoDir}, devUrl: ${devUrl}`);
    return result;
  } catch (error) {
    console.error("[GitRepoManager] prepareProjectRepo failed", {
      gitRepository,
      repoDir,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export function getClonedRepo(gitRepository: string): PreparedRepo | null {
  return clonedProjects.get(gitRepository) ?? null;
}

export function cleanupRepo(gitRepository: string): void {
  const repo = clonedProjects.get(gitRepository);
  if (repo?.devProcess) {
    console.log(`[GitRepoManager] Killing dev server for ${gitRepository}`);
    repo.devProcess.kill();
  }
  clonedProjects.delete(gitRepository);
}
