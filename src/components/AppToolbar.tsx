"use client";

import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { ToolbarProjectSelector } from "@/components/ToolbarProjectSelector";

export function AppToolbar() {
  return (
    <header className="relative flex items-center border-b border-[var(--border-subtle)] px-4 py-3.5 xl:px-6 bg-yellow-400">
      <Link
        href="/"
        className="group flex shrink-0 items-center gap-3.5 transition-opacity duration-200 hover:opacity-80"
        aria-label="Go to home page"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-lg shadow-[var(--accent-glow)] transition-shadow duration-200 group-hover:shadow-[var(--accent-glow-strong)]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5Z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex items-center gap-2.5">
          <h1
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            <span className="gradient-text">StackTalk</span>
          </h1>
        </div>
      </Link>

      {/* Separator + Project Selector */}
      <div className="ml-3 hidden sm:flex items-center gap-1.5 xl:ml-4">
        <div className="h-5 w-px bg-[var(--border-medium)] opacity-50" />
        <ToolbarProjectSelector />
      </div>

      <div className="flex flex-1" />

      {/* Mobile project selector */}
      <div className="flex sm:hidden flex-1 justify-center mx-2">
        <ToolbarProjectSelector />
      </div>

      <div className="ml-2 sm:ml-6 flex shrink-0 items-center gap-2 xl:ml-10 xl:gap-3">
        <UserMenu />
      </div>
    </header>
  );
}
