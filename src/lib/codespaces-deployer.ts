import { ParsedFile } from "./fileWriter";
import { Project } from "./types";

const GITHUB_API = "https://api.github.com";
const DEV_PORT = 3006;
const NVM_PREFIX = "source /usr/local/share/nvm/nvm.sh && nvm use default > /dev/null 2>&1;";

interface CodespacesState {
  token: string | null;
  activeCodespaces: Map<string, { name: string; previewUrl: string }>;
}

const globalState = globalThis as unknown as { __codespacesState?: CodespacesState };

function getState(): CodespacesState {
  if (!globalState.__codespacesState) {
    globalState.__codespacesState = {
      token: null,
      activeCodespaces: new Map(),
    };
  }
  return globalState.__codespacesState;
}

function getToken(): string {
  const state = getState();
  if (!state.token) {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) {
      throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set");
    }
    state.token = token;
  }
  return state.token;
}

function parseGitRepo(gitRepository: string): { owner: string; repo: string } {
  const match = gitRepository.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) {
    throw new Error(`Cannot parse GitHub owner/repo from: ${gitRepository}`);
  }
  return { owner: match[1], repo: match[2] };
}

async function githubFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
  return response;
}

async function findOrCreateCodespace(
  owner: string,
  repo: string,
  onLog?: (msg: string) => void,
  branch?: string
): Promise<string> {
  const state = getState();
  const projectKey = branch ? `${owner}/${repo}:${branch}` : `${owner}/${repo}`;
  const existing = state.activeCodespaces.get(projectKey);
  if (existing) {
    onLog?.(`Reusing codespace: ${existing.name}`);
    return existing.name;
  }
  onLog?.("Checking for existing codespaces...");
  const listRes = await githubFetch(`/repos/${owner}/${repo}/codespaces`);
  if (listRes.ok) {
    const data = await listRes.json();
    const running = data.codespaces?.find(
      (cs: { state: string }) => cs.state === "Available"
    );
    if (running) {
      onLog?.(`Found running codespace: ${running.name}`);
      state.activeCodespaces.set(projectKey, { name: running.name, previewUrl: "" });
      return running.name;
    }
    const stopped = data.codespaces?.[0];
    if (stopped) {
      onLog?.(`Starting stopped codespace: ${stopped.name}...`);
      await githubFetch(`/user/codespaces/${stopped.name}/start`, { method: "POST" });
      await waitForCodespace(stopped.name, onLog);
      state.activeCodespaces.set(projectKey, { name: stopped.name, previewUrl: "" });
      return stopped.name;
    }
  }
  const ref = branch || "main";
  onLog?.(`Creating new codespace for ${owner}/${repo} (ref: ${ref})...`);
  const createRes = await githubFetch(`/repos/${owner}/${repo}/codespaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref,
      machine: "basicLinux32gb",
      display_name: `stacktalk-${repo}`,
    }),
  });
  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Failed to create codespace: ${createRes.status} ${errorBody}`);
  }
  const codespace = await createRes.json();
  onLog?.(`Codespace created: ${codespace.name}`);
  await waitForCodespace(codespace.name, onLog);
  state.activeCodespaces.set(projectKey, { name: codespace.name, previewUrl: "" });
  return codespace.name;
}

async function waitForCodespace(
  codespaceName: string,
  onLog?: (msg: string) => void,
  maxAttempts: number = 30
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await githubFetch(`/user/codespaces/${codespaceName}`);
    if (res.ok) {
      const cs = await res.json();
      if (cs.state === "Available") {
        onLog?.("Codespace is ready");
        return;
      }
      onLog?.(`Codespace state: ${cs.state} (attempt ${i + 1}/${maxAttempts})`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`Codespace ${codespaceName} did not become available`);
}

async function initializeDevServer(
  codespaceName: string,
  onLog?: (msg: string) => void
): Promise<void> {
  onLog?.("Installing dependencies on codespace...");
  await executeCommand(codespaceName, "cd /workspaces/* && npm install");
  onLog?.("Starting dev server...");
  await executeCommand(
    codespaceName,
    "cd /workspaces/* && nohup npm run dev -- --hostname 0.0.0.0 > /tmp/dev.log 2>&1 &"
  );
  onLog?.("Dev server starting in background...");
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

async function executeCommand(
  codespaceName: string,
  command: string
): Promise<string> {
  const res = await githubFetch(`/user/codespaces/${codespaceName}/machines`);
  if (!res.ok) {
    console.log("Falling back to gh CLI for command execution");
  }
  const { execSync } = await import("child_process");
  const token = getToken();
  const fullCommand = `${NVM_PREFIX} ${command}`;
  const result = execSync(
    `GITHUB_TOKEN=${token} gh cs ssh -c ${codespaceName} -- "${fullCommand.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", timeout: 120000 }
  );
  return result;
}

async function getPreviewUrl(
  codespaceName: string,
  onLog?: (msg: string) => void
): Promise<string> {
  onLog?.("Setting up port forwarding...");
  const { execSync } = await import("child_process");
  const token = getToken();
  try {
    execSync(
      `GITHUB_TOKEN=${token} gh cs ports visibility ${DEV_PORT}:public -c ${codespaceName}`,
      { encoding: "utf-8", timeout: 30000 }
    );
  } catch (err) {
    onLog?.(`Port visibility command failed, port may already be public: ${err instanceof Error ? err.message : String(err)}`);
  }
  const portsOutput = execSync(
    `GITHUB_TOKEN=${token} gh cs ports -c ${codespaceName} --json label,browseUrl`,
    { encoding: "utf-8", timeout: 15000 }
  );
  const ports = JSON.parse(portsOutput);
  const devPort = ports.find(
    (p: { label: string; browseUrl: string }) =>
      p.browseUrl?.includes(`-${DEV_PORT}.`)
  );
  if (devPort?.browseUrl) {
    onLog?.(`Preview URL: ${devPort.browseUrl}`);
    return devPort.browseUrl;
  }
  const codespaceRes = await githubFetch(`/user/codespaces/${codespaceName}`);
  if (codespaceRes.ok) {
    const cs = await codespaceRes.json();
    const url = `https://${cs.name}-${DEV_PORT}.app.github.dev`;
    onLog?.(`Preview URL (constructed): ${url}`);
    return url;
  }
  throw new Error("Could not determine preview URL");
}

async function syncFiles(
  codespaceName: string,
  parsedFiles: ParsedFile[],
  onLog?: (msg: string) => void
): Promise<void> {
  onLog?.(`Syncing ${parsedFiles.length} file(s) to codespace...`);
  const { execSync } = await import("child_process");
  const { writeFileSync, mkdirSync, unlinkSync } = await import("fs");
  const { join, dirname } = await import("path");
  const tmpDir = `/tmp/codespace-sync-${Date.now()}`;
  mkdirSync(tmpDir, { recursive: true });
  const token = getToken();
  for (const file of parsedFiles) {
    const localTmp = join(tmpDir, file.filePath);
    mkdirSync(dirname(localTmp), { recursive: true });
    writeFileSync(localTmp, file.content, "utf-8");
    const remotePath = `/workspaces/*/${file.filePath}`;
    try {
      execSync(
        `GITHUB_TOKEN=${token} gh cs cp ${localTmp} remote:${remotePath} -c ${codespaceName}`,
        { encoding: "utf-8", timeout: 30000 }
      );
      onLog?.(`Synced: ${file.filePath}`);
    } catch (err) {
      onLog?.(`Failed to sync ${file.filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  try {
    execSync(`rm -rf ${tmpDir}`, { encoding: "utf-8" });
  } catch {
    // cleanup best-effort
  }
  onLog?.("All files synced to codespace");
}

export async function deployToPreview(
  project: Project,
  parsedFiles: ParsedFile[],
  onLog: (msg: string) => void,
  branch?: string
): Promise<string> {
  if (!project.gitRepository) {
    throw new Error("Project has no gitRepository configured");
  }
  onLog("Deploying to GitHub Codespace preview...");
  const { owner, repo } = parseGitRepo(project.gitRepository);
  const codespaceName = await findOrCreateCodespace(owner, repo, onLog, branch);
  const state = getState();
  const projectKey = branch ? `${owner}/${repo}:${branch}` : `${owner}/${repo}`;
  const cached = state.activeCodespaces.get(projectKey);
  if (!cached?.previewUrl) {
    await initializeDevServer(codespaceName, onLog);
    const previewUrl = await getPreviewUrl(codespaceName, onLog);
    state.activeCodespaces.set(projectKey, { name: codespaceName, previewUrl });
  }
  await syncFiles(codespaceName, parsedFiles, onLog);
  onLog("Waiting for HMR to pick up changes...");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const finalState = state.activeCodespaces.get(projectKey);
  const previewUrl = finalState?.previewUrl || "";
  onLog(`Preview ready: ${previewUrl}`);
  return previewUrl;
}

export function isCodespacesEnabled(): boolean {
  return !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
}
