"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative flex h-[75vh] flex-col">
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 animate-spin text-[var(--accent-primary)]" />
            <p className="text-sm text-[var(--text-muted)]">Loading PDF...</p>
          </div>
        </div>
      )}
      {hasError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertCircle className="size-10 text-red-400" />
          <div>
            <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
              Unable to preview PDF
            </p>
            <p className="mb-4 text-[13px] text-[var(--text-muted)]">
              Your browser may not support inline PDF viewing
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-[var(--accent-primary)] text-white hover:brightness-110"
            )}
          >
            <ExternalLink className="size-4" />
            Open in new tab
          </a>
        </div>
      ) : (
        <iframe
          src={url}
          title="PDF Viewer"
          className="flex-1 border-none bg-[var(--bg-secondary)]"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
}
