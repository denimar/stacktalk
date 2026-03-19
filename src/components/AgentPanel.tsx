"use client";

import { Agent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeViewer } from "./CodeViewer";
import { Bot, CheckCircle, XCircle, Loader2, Camera, ExternalLink } from "lucide-react";

interface AgentPanelProps {
  agent: Agent;
}

const statusConfig: Record<
  Agent["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  idle: { label: "Idle", variant: "secondary" },
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
};

function StatusIcon({ status }: { status: Agent["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="size-4 animate-spin" />;
    case "completed":
      return <CheckCircle className="size-4 text-green-500" />;
    case "error":
      return <XCircle className="size-4 text-destructive" />;
    default:
      return <Bot className="size-4 text-muted-foreground" />;
  }
}

export function AgentPanel({ agent }: AgentPanelProps) {
  const config = statusConfig[agent.status];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <StatusIcon status={agent.status} />
            {agent.name}
          </CardTitle>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* Logs */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Logs</p>
          <div className="bg-muted rounded-md p-2 max-h-40 overflow-y-auto font-mono text-xs space-y-0.5">
            {agent.logs.length === 0 ? (
              <p className="text-muted-foreground">Waiting...</p>
            ) : (
              agent.logs.map((log, i) => (
                <p key={i} className="text-foreground/80">
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}{" "}
                  </span>
                  {log.message}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Error */}
        {agent.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
            <p className="text-xs text-destructive">{agent.error}</p>
          </div>
        )}

        {/* Output preview */}
        {agent.output && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Response Preview
            </p>
            <div className="bg-muted rounded-md p-2 max-h-32 overflow-y-auto text-xs">
              {agent.output.slice(0, 500)}
              {agent.output.length > 500 && "..."}
            </div>
          </div>
        )}

        {/* Live Preview (Runloop) */}
        {agent.previewUrl && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ExternalLink className="size-3" />
              Live Preview
            </p>
            <a
              href={agent.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="size-4 shrink-0" />
              <span className="truncate">{agent.previewUrl}</span>
            </a>
            <iframe
              src={agent.previewUrl}
              title="Live Preview"
              className="mt-2 w-full h-64 rounded-md border border-border"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}

        {/* Before / After Screenshots */}
        {!agent.previewUrl && agent.screenshots && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Camera className="size-3" />
              Visual Change
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Before</p>
                <div className="rounded-md overflow-hidden border border-border">
                  <img
                    src={`/api/screenshots/${agent.screenshots.before}`}
                    alt="Before change"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 text-center font-medium">After</p>
                <div className="rounded-md overflow-hidden border border-green-500/50">
                  <img
                    src={`/api/screenshots/${agent.screenshots.after}`}
                    alt="After change"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
            {agent.screenshots.darkAfter && agent.screenshots.lightAfter && (
              <>
                <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">
                  Theme Preview
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Dark</p>
                    <div className="rounded-md overflow-hidden border border-border">
                      <img
                        src={`/api/screenshots/${agent.screenshots.darkAfter}`}
                        alt="Dark theme"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 text-center font-medium">Light</p>
                    <div className="rounded-md overflow-hidden border border-border">
                      <img
                        src={`/api/screenshots/${agent.screenshots.lightAfter}`}
                        alt="Light theme"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Code blocks */}
        {agent.codeBlocks.length > 0 && (
          <div>
            {agent.codeBlocks.map((code, i) => (
              <CodeViewer key={i} code={code} index={i} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
