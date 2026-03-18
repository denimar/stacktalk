import fs from "fs/promises";
import path from "path";

export interface ParsedFile {
  filePath: string;
  content: string;
}

/**
 * Parse code blocks with file path headers from an agent response.
 * Looks for patterns like:
 *   **`src/components/Foo.tsx`**
 *   ```tsx
 *   ...code...
 *   ```
 * Also handles:
 *   `src/components/Foo.tsx`
 *   ### src/components/Foo.tsx
 *   // File: src/components/Foo.tsx
 */
export function parseFilesFromResponse(responseText: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  const seen = new Set<string>();

  function addFile(filePath: string, content: string, strategy: string) {
    const clean = filePath.trim().replace(/^[`*#\s]+|[`*\s]+$/g, "");
    if (clean && content && isValidFilePath(clean) && !seen.has(clean)) {
      seen.add(clean);
      const cleanedContent = content
        .replace(/^\/\/\s*@file:\s*\S+\s*\n/, "")
        .replace(/^\/\*\s*@file:\s*\S+\s*\*\/\s*\n/, "");
      files.push({ filePath: clean, content: cleanedContent.trimEnd() + "\n" });
      console.log(`[FileParser] Strategy ${strategy} matched: ${clean}`);
    }
  }

  // ═══ Strategy 1: @file: marker inside code blocks ═══
  const atFilePattern =
    /```[\w]*\n(?:\/\/\s*@file:\s*([\w/.:-]+\.\w+)|\/\*\s*@file:\s*([\w/.:-]+\.\w+)\s*\*\/)\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = atFilePattern.exec(responseText)) !== null) {
    const filePath = match[1] || match[2];
    const content = (match[1] ? `// @file: ${filePath}\n` : `/* @file: ${filePath} */\n`) + match[3];
    addFile(filePath, content, "1-@file");
  }

  // ═══ Strategy 2: File path header above code fence ═══
  if (files.length === 0) {
    const broadPattern =
      /^[#*`\s]*([a-zA-Z0-9_./\-]+\/[a-zA-Z0-9_.\-]+\.\w+)[`*\s]*(?:.*)?$/gm;
    let pathMatch;
    while ((pathMatch = broadPattern.exec(responseText)) !== null) {
      const filePath = pathMatch[1];
      const afterMatch = responseText.slice(pathMatch.index + pathMatch[0].length);
      const fenceMatch = afterMatch.match(/^\s*\n\s*```[\w]*\n([\s\S]*?)```/);
      if (fenceMatch) {
        addFile(filePath, fenceMatch[1], "2-header");
      }
    }
  }

  // ═══ Strategy 3: Inline file path in bold/backtick, followed by code fence ═══
  if (files.length === 0) {
    const inlinePattern =
      /\*{0,2}`([a-zA-Z0-9_./\-]+\/[a-zA-Z0-9_.\-]+\.\w+)`\*{0,2}[^\n]*/gm;
    let inlineMatch;
    while ((inlineMatch = inlinePattern.exec(responseText)) !== null) {
      const filePath = inlineMatch[1];
      const afterMatch = responseText.slice(inlineMatch.index + inlineMatch[0].length);
      const fenceMatch = afterMatch.match(/^\s*\n\s*```[\w]*\n([\s\S]*?)```/);
      if (fenceMatch) {
        addFile(filePath, fenceMatch[1], "3-inline");
      }
    }
  }

  // ═══ Strategy 4: Code block with // path or // File: path on first line ═══
  if (files.length === 0) {
    const commentPattern =
      /```[\w]*\n\/\/\s*(?:File:\s*)?([\w/.:-]+\.\w+)\n([\s\S]*?)```/g;
    let commentMatch;
    while ((commentMatch = commentPattern.exec(responseText)) !== null) {
      addFile(commentMatch[1], commentMatch[2], "4-comment");
    }
  }

  // ═══ Strategy 5: File path mentioned ANYWHERE in text, with code blocks ═══
  if (files.length === 0) {
    const allPaths: { path: string; index: number }[] = [];
    const pathInText = /`([\w./\-]+\/[\w.\-]+\.\w+)`/g;
    let m;
    while ((m = pathInText.exec(responseText)) !== null) {
      if (isValidFilePath(m[1])) {
        allPaths.push({ path: m[1], index: m.index });
      }
    }
    // Also look for unquoted file paths in prose
    const prosePathPattern = /(?:^|\s)((?:src|app|lib|components|pages|public|styles)\/[\w./\-]+\.\w+)/gm;
    while ((m = prosePathPattern.exec(responseText)) !== null) {
      if (isValidFilePath(m[1]) && !allPaths.some((p) => p.path === m![1])) {
        allPaths.push({ path: m[1], index: m.index });
      }
    }
    const allCodeBlocks: { content: string; index: number }[] = [];
    const codeBlockPattern = /```[\w]*\n([\s\S]*?)```/g;
    while ((m = codeBlockPattern.exec(responseText)) !== null) {
      if (m[1].trim().length > 30) {
        allCodeBlocks.push({ content: m[1], index: m.index });
      }
    }
    for (const block of allCodeBlocks) {
      let bestPath = "";
      let bestDist = Infinity;
      for (const p of allPaths) {
        const dist = block.index - p.index;
        if (dist > 0 && dist < bestDist) {
          bestDist = dist;
          bestPath = p.path;
        }
      }
      if (bestPath) {
        addFile(bestPath, block.content, "5-nearest");
      }
    }
  }

  // ═══ Strategy 6: Detect file path from code content itself ═══
  // If code starts with known patterns (import, "use client", etc.),
  // try to infer the file path from surrounding text
  if (files.length === 0) {
    const codeBlockPattern = /```[\w]*\n([\s\S]*?)```/g;
    let m;
    while ((m = codeBlockPattern.exec(responseText)) !== null) {
      const content = m[1].trim();
      if (content.length < 30) continue;
      // Look backwards from the code fence for any file path reference
      const beforeCode = responseText.slice(Math.max(0, m.index - 500), m.index);
      // Match file paths in various formats
      const pathPatterns = [
        /[\s`*#]+([\w./\-]+\/[\w.\-]+\.\w+)[`*\s]*$/,
        /([\w./\-]+\/[\w.\-]+\.\w+)\s*[:—\-]\s*$/,
        /(?:update|create|modify|edit|change|file|in)\s+`?([\w./\-]+\/[\w.\-]+\.\w+)`?/i,
      ];
      for (const pattern of pathPatterns) {
        const pathMatch = beforeCode.match(pattern);
        if (pathMatch && isValidFilePath(pathMatch[1])) {
          addFile(pathMatch[1], content, "6-inferred");
          break;
        }
      }
    }
  }

  console.log(
    `[FileParser] Parsed ${files.length} file(s) from response (${responseText.length} chars)`
  );
  if (files.length === 0 && responseText.includes("```")) {
    console.log(
      `[FileParser] WARNING: Response has code fences but no file paths matched.`
    );
    const fenceIdx = responseText.indexOf("```");
    const contextStart = Math.max(0, fenceIdx - 300);
    const contextEnd = Math.min(responseText.length, fenceIdx + 400);
    console.log(
      `[FileParser] Context around first fence:\n${responseText.slice(contextStart, contextEnd)}`
    );
  }

  return files;
}

function isValidFilePath(p: string): boolean {
  // Must look like a relative file path (no absolute paths, no traversal)
  if (p.startsWith("/") || p.includes("..")) return false;
  // Must have a file extension
  if (!path.extname(p)) return false;
  // Must not be a dependency path
  if (p.includes("node_modules")) return false;
  return true;
}

/**
 * Write parsed files to the project directory.
 * Creates directories as needed.
 */
export async function writeFilesToProject(
  projectDir: string,
  files: ParsedFile[]
): Promise<{ written: string[]; errors: { file: string; error: string }[] }> {
  const written: string[] = [];
  const errors: { file: string; error: string }[] = [];

  for (const file of files) {
    const fullPath = path.join(projectDir, file.filePath);

    try {
      // Create parent directories
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      // Write the file
      await fs.writeFile(fullPath, file.content, "utf-8");
      written.push(file.filePath);
    } catch (err) {
      errors.push({
        file: file.filePath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { written, errors };
}
