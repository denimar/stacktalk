"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

interface DocViewerProps {
  url: string;
}

export function DocViewer({ url }: DocViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document");
        setIsLoading(false);
      }
    })();
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm text-[var(--text-muted)]">Converting document...</p>
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

  return (
    <div className="p-6 md:p-10">
      <div
        ref={contentRef}
        className={cn(
          "doc-viewer-content mx-auto max-w-3xl",
          "[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-[var(--text-primary)] [&_h1:first-child]:mt-0",
          "[&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)]",
          "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)]",
          "[&_p]:mb-4 [&_p]:text-[14px] [&_p]:leading-[1.75] [&_p]:text-[var(--text-secondary)]",
          "[&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:text-[14px] [&_ul]:text-[var(--text-secondary)]",
          "[&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:text-[14px] [&_ol]:text-[var(--text-secondary)]",
          "[&_li]:leading-[1.75] [&_li]:text-[var(--text-secondary)]",
          "[&_a]:text-[var(--accent-primary)] [&_a]:underline [&_a]:underline-offset-2",
          "[&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]",
          "[&_em]:italic",
          "[&_table]:my-4 [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:border [&_table]:border-[var(--border-subtle)] [&_table]:text-[13px]",
          "[&_th]:border-b [&_th]:border-[var(--border-subtle)] [&_th]:bg-[var(--bg-secondary)] [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[12px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[var(--text-muted)]",
          "[&_td]:border-t [&_td]:border-[var(--border-subtle)] [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-[var(--text-secondary)]",
          "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-[var(--border-subtle)]",
          "[&_blockquote]:my-4 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--accent-primary)]/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--text-muted)]"
        )}
        dangerouslySetInnerHTML={{ __html: html ?? "" }}
      />
    </div>
  );
}
