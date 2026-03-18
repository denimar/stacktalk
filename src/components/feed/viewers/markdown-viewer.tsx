"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

interface MarkdownViewerProps {
  url: string;
}

export function MarkdownViewer({ url }: MarkdownViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setError(err instanceof Error ? err.message : "Failed to load markdown");
        setIsLoading(false);
      });
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[var(--accent-primary)]" />
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
      <article className={cn("prose-viewer mx-auto max-w-3xl")}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 mt-8 text-2xl font-bold tracking-tight text-[var(--text-primary)] first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-7 text-xl font-semibold text-[var(--text-primary)]">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-lg font-semibold text-[var(--text-primary)]">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="mb-2 mt-4 text-base font-semibold text-[var(--text-primary)]">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-[14px] leading-[1.75] text-[var(--text-secondary)]">
                {children}
              </p>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-primary)] underline underline-offset-2 transition-colors hover:brightness-125"
              >
                {children}
              </a>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 ml-5 list-disc space-y-1 text-[14px] text-[var(--text-secondary)]">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-5 list-decimal space-y-1 text-[14px] text-[var(--text-secondary)]">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-[1.75] text-[var(--text-secondary)]">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-[3px] border-[var(--accent-primary)]/40 pl-4 italic text-[var(--text-muted)]">
                {children}
              </blockquote>
            ),
            code: ({ className, children }) => {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                const lang = className?.replace("language-", "") ?? "";
                return (
                  <div className="group/code relative my-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    {lang && (
                      <div className="border-b border-[var(--border-subtle)] px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {lang}
                      </div>
                    )}
                    <pre className="overflow-x-auto p-4">
                      <code className="text-[13px] leading-[1.6] text-[var(--text-secondary)]">
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              }
              return (
                <code className="rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--accent-primary)]">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <>{children}</>,
            hr: () => (
              <hr className="my-6 border-t border-[var(--border-subtle)]" />
            ),
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full text-[13px]">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-t border-[var(--border-subtle)] px-4 py-2.5 text-[var(--text-secondary)]">
                {children}
              </td>
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt ?? ""}
                className="my-4 max-w-full rounded-lg border border-[var(--border-subtle)]"
                loading="lazy"
              />
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            input: ({ checked, ...rest }) => (
              <input
                type="checkbox"
                checked={checked}
                readOnly
                className="mr-2 accent-[var(--accent-primary)]"
              />
            ),
          }}
        >
          {content ?? ""}
        </ReactMarkdown>
      </article>
    </div>
  );
}
