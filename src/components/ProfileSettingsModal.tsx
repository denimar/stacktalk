"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  UserRound,
  ShieldCheck,
  Camera,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  } | null;
  onProfileUpdated: () => void;
}

type TabId = "profile" | "security";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: ShieldCheck },
];

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "var(--destructive)" };
  if (score <= 2) return { score: 2, label: "Fair", color: "var(--accent-warm)" };
  if (score <= 3) return { score: 3, label: "Good", color: "var(--accent-secondary)" };
  return { score: 4, label: "Strong", color: "var(--accent-primary)" };
}

export function ProfileSettingsModal({
  open,
  onOpenChange,
  user,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && open) {
      setName(user.name);
      setEmail(user.email);
      setAvatarPreview(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setToast(null);
    }
  }, [user, open]);

  const initials = useMemo(() => {
    const userName = user?.name ?? "U";
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  );

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      showToast("error", "Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          avatar: avatarPreview ?? user?.avatar,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast("error", data.error ?? "Failed to update profile");
        return;
      }
      showToast("success", "Profile updated successfully");
      onProfileUpdated();
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("error", "All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showToast("error", "Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast("error", data.error ?? "Failed to change password");
        return;
      }
      showToast("success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  }

  const displayAvatar = avatarPreview ?? user?.avatar ?? undefined;
  const hasProfileChanges =
    name !== (user?.name ?? "") ||
    email !== (user?.email ?? "") ||
    avatarPreview !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="sm:max-w-[680px] w-full p-0 overflow-hidden bg-[var(--bg-surface)] ring-1 ring-[var(--border-medium)] shadow-2xl shadow-[var(--shadow-color)]"
      >
        <div className="sr-only">
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your profile information and security settings
          </DialogDescription>
        </div>

        {/* Toast notification */}
        {toast && (
          <div
            className={cn(
              "absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg",
              "animate-fade-slide-up",
              toast.type === "success"
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                : "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"
            )}
          >
            {toast.type === "success" ? (
              <Check className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {toast.message}
          </div>
        )}

        <div className="flex min-h-[480px]">
          {/* Sidebar navigation */}
          <nav className="hidden sm:flex flex-col w-[200px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 gap-1">
            <div className="px-3 pt-2 pb-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                Settings
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Manage your account
              </p>
            </div>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  activeTab === id
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm ring-1 ring-[var(--accent-primary)]/15"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 transition-colors duration-200",
                    activeTab === id
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)]"
                  )}
                />
                {label}
              </button>
            ))}
          </nav>

          {/* Mobile tab bar */}
          <div className="sm:hidden flex border-b border-[var(--border-subtle)] w-full">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-200 cursor-pointer border-b-2",
                  activeTab === id
                    ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeTab === "profile" && (
              <div className="flex-1 p-6 overflow-y-auto animate-fade-slide-up">
                {/* Avatar section */}
                <div className="flex items-start gap-5 mb-8">
                  <div className="relative group">
                    <div className="relative">
                      {/* Glow ring */}
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/30 via-[var(--accent-secondary)]/20 to-[var(--accent-warm)]/15 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
                      <Avatar className="size-20 relative ring-2 ring-[var(--border-medium)] group-hover:ring-[var(--accent-primary)]/40 transition-all duration-300">
                        {displayAvatar ? (
                          <AvatarImage src={displayAvatar} alt={name} />
                        ) : null}
                        <AvatarFallback className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-lg font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Upload overlay */}
                      <button
                        onClick={handleAvatarClick}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      >
                        <Camera className="size-5 text-white" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">
                        {user?.name ?? "User"}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 shrink-0"
                      >
                        <Sparkles className="size-3 mr-0.5" />
                        {user?.role ?? "member"}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate">
                      {user?.email ?? ""}
                    </p>
                    <button
                      onClick={handleAvatarClick}
                      className="mt-2.5 text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors cursor-pointer"
                    >
                      Change photo
                    </button>
                  </div>
                </div>

                <Separator className="bg-[var(--border-subtle)] mb-6" />

                {/* Form fields */}
                <div className="space-y-5">
                  <FormField label="Full name">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="h-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200"
                    />
                  </FormField>
                  <FormField label="Email address">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200"
                    />
                  </FormField>
                  <FormField label="Role">
                    <div className="h-10 flex items-center px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                      {user?.role ?? "member"}
                    </div>
                  </FormField>
                </div>

                {/* Save button */}
                <div className="flex justify-end mt-8">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving || !hasProfileChanges}
                    className={cn(
                      "h-9 px-5 text-sm font-medium rounded-lg transition-all duration-200",
                      hasProfileChanges
                        ? "bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-md shadow-[var(--accent-primary)]/20"
                        : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                    ) : (
                      <Check className="size-4 mr-1.5" />
                    )}
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="flex-1 p-6 overflow-y-auto animate-fade-slide-up">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Change password
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Update your password to keep your account secure
                  </p>
                </div>

                <div className="space-y-5">
                  <FormField label="Current password">
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="h-10 pr-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </FormField>

                  <FormField label="New password">
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="h-10 pr-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        {showNewPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {newPassword && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  level <= passwordStrength.score
                                    ? passwordStrength.color
                                    : "var(--bg-elevated)",
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="text-xs font-medium transition-colors duration-200"
                          style={{ color: passwordStrength.color }}
                        >
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </FormField>

                  <FormField label="Confirm new password">
                    <div className="relative">
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={cn(
                          "h-10 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 transition-all duration-200",
                          passwordsMatch &&
                            "border-emerald-500/40 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20",
                          passwordsMismatch &&
                            "border-red-500/40 focus-visible:border-red-500/60 focus-visible:ring-red-500/20"
                        )}
                      />
                      {passwordsMatch && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Check className="size-4 text-emerald-400" />
                        </div>
                      )}
                      {passwordsMismatch && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <AlertCircle className="size-4 text-red-400" />
                        </div>
                      )}
                    </div>
                    {passwordsMismatch && (
                      <p className="text-xs text-red-400 mt-1.5">
                        Passwords do not match
                      </p>
                    )}
                  </FormField>
                </div>

                {/* Change password button */}
                <div className="flex justify-end mt-8">
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      changingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !passwordsMatch
                    }
                    className={cn(
                      "h-9 px-5 text-sm font-medium rounded-lg transition-all duration-200",
                      currentPassword && newPassword && passwordsMatch
                        ? "bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-md shadow-[var(--accent-primary)]/20"
                        : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                    )}
                  >
                    {changingPassword ? (
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                    ) : (
                      <ShieldCheck className="size-4 mr-1.5" />
                    )}
                    {changingPassword ? "Updating..." : "Update password"}
                  </Button>
                </div>

                {/* Security tip */}
                <div className="mt-8 p-4 rounded-xl bg-[var(--bg-secondary)] ring-1 ring-[var(--border-subtle)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--accent-primary)]/10">
                      <ShieldCheck className="size-4 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        Password tips
                      </p>
                      <ul className="mt-1.5 space-y-0.5 text-xs text-[var(--text-muted)]">
                        <li>Use at least 8 characters</li>
                        <li>Mix uppercase and lowercase letters</li>
                        <li>Include numbers and special characters</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
