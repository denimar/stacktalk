"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Loader2, AlertCircle, Copy, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import hljs from "highlight.js/lib/core";

import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import rust from "highlight.js/lib/languages/rust";
import php from "highlight.js/lib/languages/php";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import css from "highlight.js/lib/languages/css";
import scss from "highlight.js/lib/languages/scss";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import plaintext from "highlight.js/lib/languages/plaintext";
import diff from "highlight.js/lib/languages/diff";
import ini from "highlight.js/lib/languages/ini";
import lua from "highlight.js/lib/languages/lua";
import perl from "highlight.js/lib/languages/perl";
import r from "highlight.js/lib/languages/r";
import scala from "highlight.js/lib/languages/scala";
import dart from "highlight.js/lib/languages/dart";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("python", python);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("php", php);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("css", css);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("diff", diff);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("perl", perl);
hljs.registerLanguage("r", r);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("dart", dart);

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  py: "python",
  rb: "ruby",
  go: "go",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  rs: "rust",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  css: "css",
  scss: "scss",
  sass: "scss",
  html: "xml",
  htm: "xml",
  xml: "xml",
  svg: "xml",
  yml: "yaml",
  yaml: "yaml",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",
  md: "markdown",
  mdx: "markdown",
  dockerfile: "dockerfile",
  txt: "plaintext",
  log: "plaintext",
  diff: "diff",
  patch: "diff",
  ini: "ini",
  toml: "ini",
  conf: "ini",
  cfg: "ini",
  env: "ini",
  lua: "lua",
  pl: "perl",
  pm: "perl",
  r: "r",
  R: "r",
  scala: "scala",
  dart: "dart",
  makefile: "bash",
  gitignore: "plaintext",
  editorconfig: "ini",
  prettierrc: "json",
  eslintrc: "json",
};

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  json: "JSON",
  python: "Python",
  ruby: "Ruby",
  go: "Go",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  rust: "Rust",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  css: "CSS",
  scss: "SCSS",
  xml: "HTML/XML",
  yaml: "YAML",
  sql: "SQL",
  bash: "Shell",
  markdown: "Markdown",
  dockerfile: "Dockerfile",
  plaintext: "Plain Text",
  diff: "Diff",
  ini: "Config",
  lua: "Lua",
  perl: "Perl",
  r: "R",
  scala: "Scala",
  dart: "Dart",
};

function detectLanguageFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  const baseName = lower.split("/").pop() ?? lower;
  if (baseName === "dockerfile" || baseName.startsWith("dockerfile.")) return "dockerfile";
  if (baseName === "makefile" || baseName === "gnumakefile") return "bash";
  if (baseName === ".gitignore" || baseName === ".dockerignore") return "plaintext";
  if (baseName === ".editorconfig") return "ini";
  if (baseName === ".prettierrc" || baseName === ".eslintrc") return "json";
  if (baseName === ".env" || baseName.startsWith(".env.")) return "ini";
  const ext = baseName.split(".").pop() ?? "";
  return EXTENSION_TO_LANGUAGE[ext] ?? "plaintext";
}

export function isCodeFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  const baseName = lower.split("/").pop() ?? lower;
  if (["dockerfile", "makefile", "gnumakefile", ".gitignore", ".dockerignore", ".editorconfig", ".prettierrc", ".eslintrc"].includes(baseName)) return true;
  if (baseName.startsWith(".env")) return true;
  if (baseName.startsWith("dockerfile.")) return true;
  const ext = baseName.split(".").pop() ?? "";
  return ext in EXTENSION_TO_LANGUAGE;
}

interface CodeViewerProps {
  url: string;
  fileName: string;
}

export function CodeViewer({ url, fileName }: CodeViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const codeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const language = useMemo(() => detectLanguageFromFileName(fileName), [fileName]);
  const languageLabel = LANGUAGE_LABELS[language] ?? language;

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load file");
        setIsLoading(false);
      });
  }, [url]);

  const highlighted = useMemo(() => {
    if (!content) return null;
    try {
      const result = hljs.highlight(content, { language });
      return result.value;
    } catch {
      return hljs.highlight(content, { language: "plaintext" }).value;
    }
  }, [content, language]);

  const lineCount = useMemo(() => {
    if (!content) return 0;
    return content.split("\n").length;
  }, [content]);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", { error: err });
    }
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-5 animate-spin text-[var(--accent-primary)]" />
          <span className="font-mono text-xs text-[var(--text-muted)]">Loading source...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </div>
    );
  }

  const gutterWidth = String(lineCount).length;

  return (
    <div className="flex h-full flex-col">
      {/* ─── Toolbar ─── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 px-4 py-1.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest",
              "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
            )}
          >
            {languageLabel}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            {lineCount} lines
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMinimap((v) => !v)}
            className={cn(
              "rounded px-2 py-1 font-mono text-[10px] transition-colors",
              showMinimap
                ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
            title="Toggle minimap"
          >
            MAP
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
              copied
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            )}
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="size-3" strokeWidth={2.5} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" strokeWidth={2} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Code Area ─── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Main code with line numbers */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
        >
          <div ref={codeRef} className="relative min-w-fit">
            <table className="w-full border-collapse font-mono text-[13px] leading-[1.65]">
              <tbody>
                {highlighted?.split("\n").map((line, i) => (
                  <tr
                    key={i}
                    className="group/line hover:bg-[var(--accent-primary)]/[0.04] transition-colors"
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-10 select-none border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 text-right align-top",
                        "text-[11px] text-[var(--text-muted)]/50 transition-colors",
                        "group-hover/line:text-[var(--accent-primary)]/60 group-hover/line:bg-[var(--bg-secondary)]"
                      )}
                      style={{ width: `${gutterWidth + 2}ch`, minWidth: `${gutterWidth + 2}ch` }}
                    >
                      {i + 1}
                    </td>
                    <td className="px-4 align-top">
                      <span
                        className="code-line-content text-[var(--text-secondary)]"
                        dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Minimap ─── */}
        {showMinimap && lineCount > 30 && (
          <Minimap
            content={content ?? ""}
            scrollRef={scrollRef}
            lineCount={lineCount}
          />
        )}
      </div>
    </div>
  );
}

interface MinimapProps {
  content: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  lineCount: number;
}

function Minimap({ content, scrollRef, lineCount }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportIndicator, setViewportIndicator] = useState({ top: 0, height: 20 });
  const isDragging = useRef(false);

  const minimapHeight = Math.min(lineCount * 2.5, 500);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = 80;
    const height = minimapHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    const lines = content.split("\n");
    const lineH = height / lines.length;
    lines.forEach((line, i) => {
      const y = i * lineH;
      const trimmed = line.replace(/\t/g, "  ");
      const indent = trimmed.search(/\S/);
      const textLen = Math.min(trimmed.length, 60);
      if (textLen > 0) {
        const startX = Math.max(0, indent) * 0.8 + 2;
        const barWidth = Math.min(textLen * 0.8, width - startX - 2);
        ctx.fillStyle = "rgba(139, 153, 194, 0.18)";
        ctx.fillRect(startX, y, barWidth, Math.max(lineH - 0.5, 1));
      }
    });
  }, [content, minimapHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateIndicator = () => {
      const scrollRatio = el.scrollTop / el.scrollHeight;
      const visibleRatio = el.clientHeight / el.scrollHeight;
      setViewportIndicator({
        top: scrollRatio * minimapHeight,
        height: Math.max(visibleRatio * minimapHeight, 12),
      });
    };
    updateIndicator();
    el.addEventListener("scroll", updateIndicator, { passive: true });
    return () => el.removeEventListener("scroll", updateIndicator);
  }, [scrollRef, minimapHeight]);

  const handleMinimapClick = useCallback(
    (e: React.MouseEvent) => {
      const el = scrollRef.current;
      const container = containerRef.current;
      if (!el || !container) return;
      const rect = container.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const ratio = clickY / minimapHeight;
      el.scrollTop = ratio * el.scrollHeight - el.clientHeight / 2;
    },
    [scrollRef, minimapHeight]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      handleMinimapClick(e);
      const handleMouseMove = (me: MouseEvent) => {
        if (!isDragging.current) return;
        const el = scrollRef.current;
        const container = containerRef.current;
        if (!el || !container) return;
        const rect = container.getBoundingClientRect();
        const y = me.clientY - rect.top;
        const ratio = y / minimapHeight;
        el.scrollTop = ratio * el.scrollHeight - el.clientHeight / 2;
      };
      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [scrollRef, minimapHeight, handleMinimapClick]
  );

  return (
    <div
      ref={containerRef}
      className="hidden sm:block shrink-0 w-[80px] border-l border-[var(--border-subtle)] bg-[var(--bg-primary)] cursor-pointer relative overflow-hidden"
      onMouseDown={handleMouseDown}
    >
      <canvas ref={canvasRef} className="pointer-events-none" />
      <div
        className="absolute left-0 right-0 rounded-sm bg-[var(--accent-primary)]/10 border-y border-[var(--accent-primary)]/20 transition-[top] duration-75"
        style={{
          top: viewportIndicator.top,
          height: viewportIndicator.height,
        }}
      />
    </div>
  );
}
