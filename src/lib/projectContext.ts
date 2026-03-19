import fs from "fs/promises";
import path from "path";

const MAX_CONTEXT_SIZE = 50_000; // 50KB total budget
const MAX_TREE_ENTRIES = 200;
const MAX_TREE_DEPTH = 4;
const MAX_FILE_SIZE = 3_000; // 3KB per source file
const MAX_CONFIG_SIZE = 5_000; // 5KB per config file

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".claude-session",
  "coverage",
  ".turbo",
  ".cache",
  ".output",
  "__pycache__",
  ".agent-repos",
]);

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".md",
  ".html",
  ".yaml",
  ".yml",
  ".env.example",
  ".prisma",
  ".graphql",
  ".sql",
]);

const CONFIG_FILES = [
  "CLAUDE.md",
  "package.json",
  "tsconfig.json",
  "README.md",
  ".env.example",
];

// Cache with promise-based dedup
const cache = new Map<string, { promise: Promise<string>; timestamp: number }>();
const CACHE_TTL = 60_000; // 60 seconds

export async function getProjectContext(projectDir: string): Promise<string> {
  const now = Date.now();
  const cached = cache.get(projectDir);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.promise;
  }

  const promise = buildContext(projectDir);
  cache.set(projectDir, { promise, timestamp: now });

  return promise;
}

async function buildContext(projectDir: string): Promise<string> {
  const sections: string[] = [];
  let totalSize = 0;

  // 1. File tree
  const tree = await buildFileTree(projectDir);
  sections.push(`## Project File Tree\n\n\`\`\`\n${tree}\n\`\`\``);
  totalSize += tree.length;

  // 2. Config files
  const configs = await readConfigFiles(projectDir);
  if (configs) {
    sections.push(`## Configuration Files\n\n${configs}`);
    totalSize += configs.length;
  }

  // 3. Source files (use remaining budget)
  const remainingBudget = MAX_CONTEXT_SIZE - totalSize;
  if (remainingBudget > 1000) {
    const sources = await readSourceFiles(projectDir, remainingBudget);
    if (sources) {
      sections.push(`## Source Files\n\n${sources}`);
    }
  }

  return `<project-context>\n${sections.join("\n\n")}\n</project-context>`;
}

async function buildFileTree(
  dir: string,
  prefix = "",
  depth = 0
): Promise<string> {
  if (depth > MAX_TREE_DEPTH) return "";

  const entries: string[] = [];
  let count = 0;

  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    const sorted = items.sort((a, b) => {
      // Directories first, then files
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of sorted) {
      if (count >= MAX_TREE_ENTRIES) {
        entries.push(`${prefix}... (truncated)`);
        break;
      }

      if (EXCLUDED_DIRS.has(item.name)) continue;
      if (item.name.startsWith(".") && item.isDirectory()) continue;

      if (item.isDirectory()) {
        entries.push(`${prefix}${item.name}/`);
        count++;
        const subTree = await buildFileTree(
          path.join(dir, item.name),
          prefix + "  ",
          depth + 1
        );
        if (subTree) {
          entries.push(subTree);
          count += subTree.split("\n").length;
        }
      } else {
        entries.push(`${prefix}${item.name}`);
        count++;
      }
    }
  } catch {
    // Permission error or missing directory
  }

  return entries.join("\n");
}

async function readConfigFiles(projectDir: string): Promise<string> {
  const sections: string[] = [];

  for (const fileName of CONFIG_FILES) {
    try {
      const filePath = path.join(projectDir, fileName);
      let content = await fs.readFile(filePath, "utf-8");

      // For package.json, slim it down to essentials
      if (fileName === "package.json") {
        try {
          const pkg = JSON.parse(content);
          const slim = {
            name: pkg.name,
            scripts: pkg.scripts,
            dependencies: pkg.dependencies,
            devDependencies: pkg.devDependencies,
          };
          content = JSON.stringify(slim, null, 2);
        } catch {
          // Use raw content if parse fails
        }
      }

      if (content.length > MAX_CONFIG_SIZE) {
        content = content.slice(0, MAX_CONFIG_SIZE) + "\n... (truncated)";
      }

      sections.push(`### ${fileName}\n\`\`\`\n${content}\n\`\`\``);
    } catch {
      // File doesn't exist, skip
    }
  }

  return sections.join("\n\n");
}

async function readSourceFiles(
  projectDir: string,
  budget: number
): Promise<string> {
  const sections: string[] = [];
  let usedBytes = 0;

  // Directories to scan for source files (1 level deep each)
  const scanDirs = ["src", "src/app", "src/lib", "src/components", "app", "lib", "pages"];

  const seenFiles = new Set<string>();

  for (const scanDir of scanDirs) {
    const fullDir = path.join(projectDir, scanDir);

    try {
      const items = await fs.readdir(fullDir, { withFileTypes: true });

      for (const item of items) {
        if (!item.isFile()) continue;

        const ext = path.extname(item.name);
        if (!SOURCE_EXTENSIONS.has(ext)) continue;

        const relativePath = path.join(scanDir, item.name);
        if (seenFiles.has(relativePath)) continue;
        seenFiles.add(relativePath);

        const filePath = path.join(projectDir, relativePath);

        try {
          const stat = await fs.stat(filePath);
          if (stat.size > MAX_FILE_SIZE) continue;

          const content = await fs.readFile(filePath, "utf-8");
          const block = `=== FILE: ${relativePath} ===\n\`\`\`${ext.slice(1)}\n${content}\n\`\`\``;

          if (usedBytes + block.length > budget) continue;

          sections.push(block);
          usedBytes += block.length;
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  return sections.join("\n\n");
}
