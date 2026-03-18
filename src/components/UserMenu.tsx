"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { useTheme } from "@/components/ThemeProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  FileText,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, refresh } = useCurrentUser();
  const router = useRouter();

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const userName = user?.name ?? "User";
  const userEmail = user?.email ?? "";
  const avatarUrl = user?.avatar ?? undefined;

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex items-center outline-none cursor-pointer"
        aria-label="User menu"
      >
        <Avatar className="size-8 hover:opacity-80 transition-opacity duration-150">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={userName} />
          ) : null}
          <AvatarFallback className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl bg-[var(--bg-surface)] p-0 shadow-xl ring-1 ring-[var(--border-medium)] overflow-hidden gap-0"
      >
        {/* User info */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {userName}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
            {userEmail}
          </p>

          {/* Theme selector pill */}
          <div className="flex items-center gap-1 mt-3 w-fit rounded-lg bg-[var(--bg-elevated)] p-1 ring-1 ring-[var(--border-subtle)]">
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={label}
                className={cn(
                  "flex items-center justify-center rounded-md p-1.5 transition-all duration-150 cursor-pointer",
                  theme === value
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border-medium)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-[var(--border-subtle)]" />

        {/* Menu items */}
        <div className="px-1.5 py-1.5">
          <MenuItem
            icon={<User className="size-4" />}
            label="Your profile"
            onClick={() => {
              setOpen(false);
              setProfileOpen(true);
            }}
          />
          <MenuItem
            icon={<FileText className="size-4" />}
            label="Terms & policies"
          />
          <MenuItem
            icon={<HelpCircle className="size-4" />}
            label="Help"
          />
        </div>

        <Separator className="bg-[var(--border-subtle)]" />

        {/* Sign out */}
        <div className="px-1.5 py-1.5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </PopoverContent>

      <ProfileSettingsModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        onProfileUpdated={refresh}
      />
    </Popover>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
    >
      <span className="text-[var(--text-muted)] shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
