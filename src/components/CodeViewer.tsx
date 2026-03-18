"use client";

interface CodeViewerProps {
  code: string;
  index: number;
}

export function CodeViewer({ code, index }: CodeViewerProps) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        Code Block {index + 1}
      </p>
      <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}
