import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

interface BranchDeployResult {
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

async function gitExec(
  args: string[],
  cwd: string
): Promise<string> {
  const { stdout } = await exec("git", args, { cwd, timeout: 60_000 });
  return stdout.trim();
}

export async function createBranchCommitAndPush(
  repoDir: string,
  gitRepository: string,
  taskId: string,
  agentName: string,
  writtenFiles: string[],
  onLog?: (msg: string) => void
): Promise<BranchDeployResult> {
  const timestamp = Date.now();
  const branchName = `stacktalk/${sanitizeBranchName(agentName)}-${timestamp}`;
  onLog?.(`Creating branch: ${branchName}`);
  await gitExec(["checkout", "-b", branchName], repoDir);
  onLog?.(`Adding ${writtenFiles.length} file(s)...`);
  for (const file of writtenFiles) {
    await gitExec(["add", file], repoDir);
  }
  const commitMessage = `feat: ${agentName} implementation (task ${taskId.slice(0, 8)})`;
  onLog?.(`Committing: ${commitMessage}`);
  await gitExec(
    ["commit", "-m", commitMessage],
    repoDir
  );
  onLog?.("Pushing branch to remote...");
  await gitExec(["push", "-u", "origin", branchName], repoDir);
  const branchUrl = buildBranchUrl(gitRepository, branchName);
  onLog?.(`Branch pushed: ${branchUrl}`);
  return { branchName, branchUrl };
}
