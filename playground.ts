import "dotenv/config";
import { execSync } from "child_process";

const PORT = 3006;
const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GH_PERSONAL_ACCESS_TOKEN;

const NVM_PREFIX = "source /usr/local/share/nvm/nvm.sh && nvm use default > /dev/null 2>&1;";

function gh(args: string): string {
  console.log(`[gh] ${args}`);
  const result = execSync(`GITHUB_TOKEN=${token} gh ${args}`, {
    encoding: "utf-8",
    timeout: 120000,
  });
  if (result.trim()) console.log(result.trim());
  return result;
}

function csExec(name: string, command: string): string {
  return gh(`cs ssh -c ${name} -- "${NVM_PREFIX} ${command.replace(/"/g, '\\"')}"`);
}

async function updateCodespace(repo: string, branch: string): Promise<string> {
  console.log(`Setting up codespace for "${repo}" on branch "${branch}"...`);

  // Find or create codespace
  const listOutput = gh(`cs list --repo ${repo} --json name,state`);
  const codespaces = JSON.parse(listOutput);
  let name: string;

  if (codespaces.length > 0) {
    name = codespaces[0].name;
    if (codespaces[0].state !== "Available") {
      console.log(`Starting codespace ${name}...`);
      gh(`cs start -c ${name}`);
    }
  } else {
    console.log("Creating new codespace...");
    const createOutput = gh(`cs create --repo ${repo} --branch ${branch} --machine basicLinux32gb --display-name stacktalk-preview`);
    name = createOutput.trim();
  }

  // Switch branch and install
  csExec(name, `cd /workspaces/* && git fetch --all && git checkout ${branch} && git pull origin ${branch}`);
  csExec(name, "cd /workspaces/* && npm install");

  // Kill existing dev server and restart
  try {
    csExec(name, "pkill -f 'npm run dev' || exit 0");
  } catch {
    console.log("No existing dev server to kill");
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
  csExec(name, "cd /workspaces/* && nohup npm run dev -- --hostname 0.0.0.0 > /tmp/dev.log 2>&1 &");
  console.log("Dev server starting...");
  await new Promise((resolve) => setTimeout(resolve, 8000));

  // Set port to public
  try {
    gh(`cs ports visibility ${PORT}:public -c ${name}`);
  } catch {
    console.log("Port may already be public");
  }

  const portsOutput = gh(`cs ports -c ${name} --json label,browseUrl`);
  const ports = JSON.parse(portsOutput);
  const devPort = ports.find((p: { browseUrl: string }) => p.browseUrl?.includes(`-${PORT}.`));
  const url = devPort?.browseUrl || `https://${name}-${PORT}.app.github.dev`;

  console.log(`Preview URL: ${url}`);
  return url;
}

async function main() {
  const repo = process.argv[2] || "denimar/stacktalk";
  const branch = process.argv[3] || "master";
  const url = await updateCodespace(repo, branch);
  console.log(`\nReady! Browse: ${url}`);

  // Keep alive
  await new Promise(() => {});
}

main().catch(console.error);
