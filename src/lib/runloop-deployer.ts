import Runloop from "@runloop/api-client";
import { ParsedFile } from "./fileWriter";
import { Project } from "./types";

const DEVBOX_ID = process.env.RUNLOOP_DEVBOX_ID || "dbx_32kLtj2SBgB1jiuXG1AZ5";
const DEV_PORT = 3000;

interface RunloopState {
  client: Runloop | null;
  tunnelUrl: string | null;
  initializedProjects: Set<string>;
}

const globalState = globalThis as unknown as { __runloopState?: RunloopState };

function getState(): RunloopState {
  if (!globalState.__runloopState) {
    globalState.__runloopState = {
      client: null,
      tunnelUrl: null,
      initializedProjects: new Set(),
    };
  }
  return globalState.__runloopState;
}

function getClient(): Runloop {
  const state = getState();
  if (!state.client) {
    const apiKey = process.env.RUNLOOP_API_KEY;
    if (!apiKey) {
      throw new Error("RUNLOOP_API_KEY environment variable is not set");
    }
    state.client = new Runloop({ bearerToken: apiKey });
  }
  return state.client;
}

async function initializeDevbox(
  projectDir: string,
  gitRepository?: string,
  onLog?: (msg: string) => void
): Promise<void> {
  const state = getState();
  const projectKey = gitRepository || projectDir;
  if (state.initializedProjects.has(projectKey)) {
    onLog?.("Devbox already initialized for this project");
    return;
  }
  const client = getClient();
  onLog?.("Checking devbox status...");
  const devbox = await client.devboxes.retrieve(DEVBOX_ID);
  if (devbox.status !== "running") {
    throw new Error(`Devbox ${DEVBOX_ID} is not running (status: ${devbox.status})`);
  }
  if (gitRepository) {
    onLog?.(`Cloning ${gitRepository} on devbox...`);
    const cloneResult = await client.devboxes.executeSync(DEVBOX_ID, {
      command: `cd ~ && if [ ! -d project ]; then git clone ${gitRepository} project; else cd project && git pull; fi`,
    });
    onLog?.(`Clone result: exit ${cloneResult.exit_status}`);
    onLog?.("Installing dependencies on devbox...");
    const installResult = await client.devboxes.executeSync(DEVBOX_ID, {
      command: "cd ~/project && npm install",
    });
    onLog?.(`Install result: exit ${installResult.exit_status}`);
    onLog?.("Starting dev server on devbox...");
    await client.devboxes.executeAsync(DEVBOX_ID, {
      command: "cd ~/project && npm run dev -- --hostname 0.0.0.0 &",
    });
    onLog?.("Dev server starting in background...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  state.initializedProjects.add(projectKey);
  onLog?.("Devbox initialized");
}

async function enableTunnel(onLog?: (msg: string) => void): Promise<string> {
  const state = getState();
  if (state.tunnelUrl) {
    onLog?.(`Tunnel already enabled: ${state.tunnelUrl}`);
    return state.tunnelUrl;
  }
  const client = getClient();
  onLog?.("Enabling tunnel on devbox...");
  const tunnel = await client.devboxes.enableTunnel(DEVBOX_ID, {
    auth_mode: "open",
    http_keep_alive: true,
  });
  const url = `https://${DEV_PORT}-${tunnel.tunnel_key}.tunnel.runloop.ai`;
  state.tunnelUrl = url;
  onLog?.(`Tunnel enabled: ${url}`);
  return url;
}

async function syncFiles(
  parsedFiles: ParsedFile[],
  onLog?: (msg: string) => void
): Promise<void> {
  const client = getClient();
  onLog?.(`Syncing ${parsedFiles.length} file(s) to devbox...`);
  for (const file of parsedFiles) {
    const remotePath = `project/${file.filePath}`;
    await client.devboxes.writeFileContents(DEVBOX_ID, {
      file_path: remotePath,
      contents: file.content,
    });
    onLog?.(`Synced: ${file.filePath}`);
  }
  onLog?.("All files synced to devbox");
}

export async function deployToPreview(
  project: Project,
  parsedFiles: ParsedFile[],
  onLog: (msg: string) => void
): Promise<string> {
  onLog("Deploying to Runloop devbox preview...");
  await initializeDevbox(project.dir, project.gitRepository, onLog);
  const previewUrl = await enableTunnel(onLog);
  await syncFiles(parsedFiles, onLog);
  onLog("Waiting for HMR to pick up changes...");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  onLog(`Preview ready: ${previewUrl}`);
  return previewUrl;
}

export function isRunloopEnabled(): boolean {
  return !!process.env.RUNLOOP_API_KEY;
}
