import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const exec = promisify(execFile);

export interface WorktreeResult {
  worktreeDir: string;
  branchName: string;
  branchUrl: string;
}

function sanitizeBranchName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function buildBranchUrl(gitRepository: string, branchName: string): string {
  const match = gitRepository.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) return "";
  return `https://github.com/${match[1]}/${match[2]}/tree/${branchName}`;
}

async function git(args: string[], cwd: string): Promise<string> {
  const { stdout } = await exec("git", args, { cwd, timeout: 60_000 });
  return stdout.trim();
}

export async function createWorktree(
  repoDir: string,
  gitRepository: string,
  taskId: string,
  agentName: string,
  onLog?: (msg: string) => void
): Promise<WorktreeResult> {
  const timestamp = Date.now();
  const branchName = `stacktalk/${sanitizeBranchName(agentName)}-${timestamp}`;
  const worktreeDir = path.join(repoDir, ".worktrees", `${sanitizeBranchName(agentName)}-${timestamp}`);
  onLog?.(`Creating worktree: ${branchName}`);
  await git(["worktree", "add", "-b", branchName, worktreeDir], repoDir);
  const branchUrl = buildBranchUrl(gitRepository, branchName);
  onLog?.(`Worktree created at ${worktreeDir}`);
  return { worktreeDir, branchName, branchUrl };
}

export async function commitAndPush(
  worktreeDir: string,
  branchName: string,
  writtenFiles: string[],
  taskId: string,
  agentName: string,
  onLog?: (msg: string) => void
): Promise<void> {
  onLog?.(`Staging ${writtenFiles.length} file(s)...`);
  for (const file of writtenFiles) {
    await git(["add", file], worktreeDir);
  }
  const commitMessage = `feat: ${agentName} implementation (task ${taskId.slice(0, 8)})`;
  onLog?.(`Committing: ${commitMessage}`);
  await git(["commit", "-m", commitMessage], worktreeDir);
  onLog?.("Pushing branch to remote...");
  await git(["push", "-u", "origin", branchName], worktreeDir);
  onLog?.(`Branch ${branchName} pushed to remote`);
}

export async function cleanupWorktree(
  repoDir: string,
  worktreeDir: string,
  onLog?: (msg: string) => void
): Promise<void> {
  try {
    onLog?.("Cleaning up worktree...");
    await git(["worktree", "remove", worktreeDir, "--force"], repoDir);
    onLog?.("Worktree cleaned up");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    onLog?.(`Worktree cleanup warning: ${msg}`);
  }
}
