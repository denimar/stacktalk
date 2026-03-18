"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownViewer } from "@/components/feed/viewers/markdown-viewer";
import { PdfViewer } from "@/components/feed/viewers/pdf-viewer";
import { DocViewer } from "@/components/feed/viewers/doc-viewer";
import { ImageViewer } from "@/components/feed/viewers/image-viewer";
import { CodeViewer, isCodeFile } from "@/components/feed/viewers/code-viewer";

export type ViewableFileType = "markdown" | "pdf" | "doc" | "image" | "code" | "unknown";

export interface FileViewerFile {
  url: string;
  fileName: string;
  fileType: ViewableFileType;
  mimeType?: string;
}

interface FileViewerProps {
  file: FileViewerFile | null;
  onClose: () => void;
}

function detectFileType(fileName: string): ViewableFileType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["md", "markdown", "mdx"].includes(ext)) return "markdown";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif", "tiff", "tif"].includes(ext)) return "image";
  if (isCodeFile(fileName)) return "code";
  return "unknown";
}

export function resolveFileForViewer(url: string, fileName: string): FileViewerFile | null {
  const fileType = detectFileType(fileName);
  if (fileType === "unknown") return null;
  return { url, fileName, fileType };
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [file, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!file) return null;

  const fileTypeLabel = {
    markdown: "Markdown",
    pdf: "PDF Document",
    doc: "Word Document",
    image: "Image",
    code: "Source Code",
    unknown: "File",
  }[file.fileType];

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8",
        "bg-black/70 backdrop-blur-md",
        "animate-in fade-in duration-200"
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-2xl",
          "border border-[var(--border-medium)] bg-[var(--bg-primary)]",
          "shadow-2xl shadow-black/40",
          "w-full max-w-5xl",
          "max-h-[90vh]",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
          isFullscreen && "!max-w-none !max-h-none !rounded-none"
        )}
      >
        {/* ─── Header Bar ─── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase tracking-wider",
                file.fileType === "markdown" && "bg-violet-500/15 text-violet-400",
                file.fileType === "pdf" && "bg-red-500/15 text-red-400",
                file.fileType === "doc" && "bg-blue-500/15 text-blue-400",
                file.fileType === "image" && "bg-emerald-500/15 text-emerald-400",
                file.fileType === "code" && "bg-amber-500/15 text-amber-400"
              )}
            >
              {file.fileType === "markdown" && "MD"}
              {file.fileType === "pdf" && "PDF"}
              {file.fileType === "doc" && "DOC"}
              {file.fileType === "image" && "IMG"}
              {file.fileType === "code" && "</>"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                {file.fileName}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">{fileTypeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={file.url}
              download={file.fileName}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
              title="Download"
            >
              <Download className="size-4" strokeWidth={1.8} />
            </a>
            <button
              onClick={toggleFullscreen}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="size-4" strokeWidth={1.8} />
              ) : (
                <Maximize2 className="size-4" strokeWidth={1.8} />
              )}
            </button>
            <button
              onClick={onClose}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                "text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
              )}
              title="Close (Esc)"
            >
              <X className="size-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* ─── Content Area ─── */}
        <div className="flex-1 overflow-auto">
          {file.fileType === "markdown" && <MarkdownViewer url={file.url} />}
          {file.fileType === "pdf" && <PdfViewer url={file.url} />}
          {file.fileType === "doc" && <DocViewer url={file.url} />}
          {file.fileType === "image" && (
            <ImageViewer url={file.url} alt={file.fileName} />
          )}
          {file.fileType === "code" && (
            <CodeViewer url={file.url} fileName={file.fileName} />
          )}
        </div>
      </div>
    </div>
  );
}
