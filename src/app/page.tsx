"use client";

import Link from "next/link";
import {
  ListTodo,
  Bot,
  Settings,
} from "lucide-react";

const METRIC_CARDS = [
  { label: "Total Tasks", value: 0 },
  { label: "In Progress", value: 0 },
  { label: "Completed", value: 0 },
  { label: "Agents", value: 0 },
];

const NAV_CARDS = [
  {
    title: "Tasks",
    description: "Follow real-time activity and updates from your agents and tasks",
    href: "/tasks",
    icon: <ListTodo className="size-5 text-white" />,
  },
  {
    title: "Config",
    description: "Configure projects, API keys, and general application preferences",
    href: "/config",
    icon: <ListTodo className="size-5 text-white" />,
  },
  {
    title: "Agents",
    description: "Monitor running Claude agents, view logs, outputs, and screenshots",
    href: "/agents",
    icon: <Bot className="size-5 text-white" />,
  },
  {
    title: "Settings",
    description: "Configure projects, browser sessions, and agent preferences",
    href: "/settings",
    icon: <Settings className="size-5 text-white" />,
  },
];

export default function HomePage() {
  return (
    <div className="atmosphere min-h-screen bg-[var(--bg-primary)]">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="animate-fade-slide-up text-center">
          <h2
            className="text-4xl font-bold tracking-tight gradient-text md:text-5xl"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            StackTalk
          </h2>
          <p
            className="mt-3 text-lg text-[var(--text-secondary)]"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Conversational Webapp Builder DDDDDDDDD
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)]">
            Turn your ideas into fully functional applications through natural dialogue.
            Launch parallel Claude agents that collaborate in real-time to build, test, and ship your code.
          </p>
        </section>

        <section
          className="animate-fade-slide-up mt-12"
          style={{ animationDelay: "100ms" }}
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {METRIC_CARDS.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
              >
                <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
                <p
                  className="text-2xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="animate-fade-slide-up mt-12"
          style={{ animationDelay: "200ms" }}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="card-glow rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition-transform duration-200 hover:scale-[1.02]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white">
                  {card.icon}
                </div>
                <h3
                  className="text-lg font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
