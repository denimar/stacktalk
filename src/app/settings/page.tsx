"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, Zap, Globe } from "lucide-react";

type LlmProvider = "claude-subscription" | "open-router";

interface ProviderOption {
  value: LlmProvider;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    value: "claude-subscription",
    label: "Claude Code Subscription",
    description: "Uses Playwright browser automation against your claude.ai subscription session. Requires a logged-in session in .claude-session/.",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    value: "open-router",
    label: "Open Router",
    description: "Uses the OpenRouter API to communicate with LLMs. Requires OPENROUTER_API_KEY in your environment. Model: openrouter/auto.",
    icon: <Globe className="h-5 w-5" />,
  },
];

export default function SettingsPage() {
  const [provider, setProvider] = useState<LlmProvider>("claude-subscription");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/llm-provider")
      .then((res) => res.json())
      .then((data) => setProvider(data.provider))
      .catch((err) => console.error("Failed to load LLM provider setting", { error: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (value: LlmProvider) => {
    if (value === provider || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/llm-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: value }),
      });
      if (res.ok) {
        setProvider(value);
      } else {
        console.error("Failed to save LLM provider setting", { status: res.status });
      }
    } catch (err) {
      console.error("Failed to save LLM provider setting", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-elevated)] ring-1 ring-[var(--border-medium)]">
          <Settings className="h-4.5 w-4.5 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h1
            className="text-xl font-bold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Settings
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Configure how StackTalk communicates with LLMs</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>LLM Provider</CardTitle>
          <CardDescription>
            Choose how requests are sent to AI models. Both options send the same input with the same context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-[var(--skeleton-from)]"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {PROVIDER_OPTIONS.map((option) => {
                const isSelected = provider === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all duration-150 ${
                      isSelected
                        ? "border-[var(--accent-primary)] bg-[var(--accent-glow)] ring-1 ring-[var(--accent-primary)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)]"
                    } ${saving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[var(--accent-primary)] text-white"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {option.label}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                        {option.description}
                      </p>
                    </div>
                    <div className="mt-1 shrink-0">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                          isSelected
                            ? "border-[var(--accent-primary)]"
                            : "border-[var(--border-medium)]"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-primary)]" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
