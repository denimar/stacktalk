"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ListTodo, Settings, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/config", label: "Config", icon: ListTodo },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-12 shrink-0 flex flex-col h-full bg-sky-50/50 dark:bg-neutral-900/50 border-r border-sky-100/60 dark:border-neutral-800/40">
      <nav className="flex-1 flex flex-col items-center gap-0.5 pt-3 px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center justify-center size-8 rounded-md transition-colors",
                isActive
                  ? "bg-sky-100/80 dark:bg-neutral-700/60 text-sky-500 dark:text-sky-400"
                  : "text-neutral-350 dark:text-neutral-500 hover:bg-sky-50 dark:hover:bg-neutral-800 hover:text-neutral-500 dark:hover:text-neutral-300"
              )}
            >
              <Icon className="size-[15px]" strokeWidth={1.8} />
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-center pb-3">
        <Avatar className="size-6">
          <AvatarImage src="https://github.com/denimar.png" alt="denimar" />
          <AvatarFallback className="bg-neutral-700 dark:bg-neutral-600 text-white text-[9px] font-semibold">
            N
          </AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
