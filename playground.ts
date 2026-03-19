import "dotenv/config";
import Runloop from "@runloop/api-client";

const PORT = 3000;
const DEVBOX_ID = "dbx_32kQKOZ5ipXYAmk49qGsg";
const PROJECT_DIR = "/stacktalk";

const client = new Runloop({
  bearerToken: process.env.RUNLOOP_API_KEY,
});

async function runCommand(command: string): Promise<string> {
  console.log(`[cmd] ${command}`);
  const result = await client.devboxes.executeAndAwaitCompletion(DEVBOX_ID, { command });
  const output = (result.stdout || "") + (result.stderr || "");
  if (output.trim()) console.log(output.trim());
  return output;
}

async function updateTunnel(branch: string): Promise<string> {
  console.log(`Switching to branch "${branch}" and restarting dev server...`);

  await runCommand(`cd ${PROJECT_DIR} && git fetch --all`);
  await runCommand(`cd ${PROJECT_DIR} && git checkout ${branch}`);
  await runCommand(`cd ${PROJECT_DIR} && git pull origin ${branch}`);
  await runCommand(`cd ${PROJECT_DIR} && pnpm install`);

  // Kill any existing dev server
  await client.devboxes.executions.executeAsync(DEVBOX_ID, {
    command: `pkill -f "pnpm dev" || true`,
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start dev server in background
  await client.devboxes.executions.executeAsync(DEVBOX_ID, {
    command: `cd ${PROJECT_DIR} && pnpm dev --hostname 0.0.0.0 &`,
  });
  console.log("Dev server starting...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Enable tunnel
  const tunnel = await client.devboxes.enableTunnel(DEVBOX_ID, {
    auth_mode: "open",
    http_keep_alive: true,
  });
  const tunnelUrl = `https://${PORT}-${tunnel.tunnel_key}.tunnel.runloop.ai`;
  console.log(`Tunnel URL: ${tunnelUrl}`);
  return tunnelUrl;
}

async function main() {
  const branch = process.argv[2] || "master";
  const url = await updateTunnel(branch);
  console.log(`\nReady! Browse: ${url}`);

  // Keep alive
  await new Promise(() => {});
}

main().catch(console.error);
