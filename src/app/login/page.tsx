"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

function BrandIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8h6v2H4zM18 8h6v2h-6zM4 18h6v2H4zM18 18h6v2h-6z" fill="var(--login-accent)" opacity="0.6" />
      <rect x="10" y="6" width="8" height="6" rx="1" stroke="var(--login-accent)" strokeWidth="1.5" fill="none" />
      <rect x="10" y="16" width="8" height="6" rx="1" stroke="var(--login-accent-secondary)" strokeWidth="1.5" fill="none" />
      <line x1="14" y1="12" x2="14" y2="16" stroke="var(--login-accent)" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="1.5" fill="var(--login-accent)" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 4l6 4.5L14 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 9h4M12 9h4M6 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" stroke="var(--login-accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke="var(--login-accent)" strokeWidth="1.5" />
      <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="var(--login-accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="var(--login-accent)" strokeWidth="1.5" />
      <path d="M5 10l2.5-3L10 10l3-4" stroke="var(--login-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CircuitSvg() {
  return (
    <svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="60" y1="120" x2="420" y2="120" stroke="var(--login-accent)" strokeWidth="1" strokeDasharray="4 4" className="animate-[data-flow_3s_linear_infinite]" />
      <line x1="60" y1="240" x2="420" y2="240" stroke="var(--login-accent)" strokeWidth="1" strokeDasharray="4 4" className="animate-[data-flow_4s_linear_infinite]" />
      <line x1="60" y1="360" x2="420" y2="360" stroke="var(--login-accent)" strokeWidth="1" strokeDasharray="4 4" className="animate-[data-flow_3.5s_linear_infinite]" />
      <line x1="120" y1="60" x2="120" y2="420" stroke="var(--login-accent-secondary)" strokeWidth="1" strokeDasharray="4 4" className="animate-[data-flow_5s_linear_infinite]" />
      <line x1="240" y1="60" x2="240" y2="420" stroke="var(--login-accent-secondary)" strokeWidth="1" strokeDasharray="4 4" className="animate-[data-flow_4.5s_linear_infinite]" />
      <line x1="360" y1="60" x2="360" y2="420" stroke="var(--login-accent-secondary)" strokeWidth="1" strokeDasharray="4 4" className="animate-[data-flow_3.8s_linear_infinite]" />
      <circle cx="120" cy="120" r="4" fill="var(--login-accent)" className="animate-[node-glow_3s_ease-in-out_infinite]" />
      <circle cx="240" cy="120" r="3" fill="var(--login-accent)" className="animate-[node-glow_4s_ease-in-out_infinite_0.5s]" />
      <circle cx="360" cy="120" r="4" fill="var(--login-accent-secondary)" className="animate-[node-glow_3.5s_ease-in-out_infinite_1s]" />
      <circle cx="120" cy="240" r="3" fill="var(--login-accent-secondary)" className="animate-[node-glow_4s_ease-in-out_infinite_0.3s]" />
      <circle cx="240" cy="240" r="6" fill="var(--login-accent)" className="animate-[node-glow_2.5s_ease-in-out_infinite]" />
      <circle cx="360" cy="240" r="3" fill="var(--login-accent)" className="animate-[node-glow_3.8s_ease-in-out_infinite_0.8s]" />
      <circle cx="120" cy="360" r="4" fill="var(--login-accent-secondary)" className="animate-[node-glow_3.2s_ease-in-out_infinite_0.6s]" />
      <circle cx="240" cy="360" r="3" fill="var(--login-accent)" className="animate-[node-glow_4.2s_ease-in-out_infinite_0.2s]" />
      <circle cx="360" cy="360" r="4" fill="var(--login-accent)" className="animate-[node-glow_3s_ease-in-out_infinite_1.2s]" />
      <path d="M120 120 L240 240" stroke="var(--login-accent)" strokeWidth="1" opacity="0.4" strokeDasharray="4 4" className="animate-[data-flow_6s_linear_infinite]" />
      <path d="M360 120 L240 240" stroke="var(--login-accent-secondary)" strokeWidth="1" opacity="0.4" strokeDasharray="4 4" className="animate-[data-flow_5s_linear_infinite]" />
      <path d="M240 240 L120 360" stroke="var(--login-accent)" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" className="animate-[data-flow_7s_linear_infinite]" />
      <path d="M240 240 L360 360" stroke="var(--login-accent-secondary)" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" className="animate-[data-flow_5.5s_linear_infinite]" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleSubmit();
    }
  }

  return (
    <>
      <style>{`
        :root {
          --login-bg: #f4f6fb;
          --login-bg-secondary: #fff;
          --login-bg-surface: #fff;
          --login-bg-elevated: #fff;
          --login-accent: #0284c7;
          --login-accent-secondary: #2a8fc7;
          --login-text-primary: #0c0f1a;
          --login-text-secondary: #4a5578;
          --login-text-muted: #7d89a8;
          --login-border-subtle: #1e326412;
          --login-border-medium: #1e326421;
        }
        .login-gradient-text {
          background: linear-gradient(135deg, var(--login-accent), var(--login-accent-secondary));
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          font-family: var(--font-syne);
        }
        .login-circuit-pattern {
          background-image: radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--login-accent) 8%, transparent) 1px, transparent 0);
          background-size: 32px 32px;
        }
        .login-input-depth {
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.12), inset 0 0 0 1px transparent;
        }
        .login-input-depth:focus {
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px var(--login-accent), 0 0 12px -4px color-mix(in srgb, var(--login-accent) 20%, transparent);
        }
        .login-btn-glow {
          box-shadow: 0 2px 12px -2px color-mix(in srgb, var(--login-accent) 30%, transparent);
          transition: all 0.25s;
        }
        .login-btn-glow:hover {
          box-shadow: 0 4px 20px -2px color-mix(in srgb, var(--login-accent) 45%, transparent), 0 0 40px -8px color-mix(in srgb, var(--login-accent) 20%, transparent);
        }
        @keyframes login-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes login-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes login-slide-right {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(0.95); }
          66% { transform: translate(20px, -15px) scale(1.05); }
        }
        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(0) scale(1); }
          33% { transform: translate(15px, 25px) scale(1.03); }
          66% { transform: translate(-15px, -20px) scale(0.97); }
        }
        @keyframes node-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes data-flow {
          0% { stroke-dashoffset: 20px; }
          100% { stroke-dashoffset: 0; }
        }
        .login-card-enter {
          animation: 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both login-fade-up;
        }
        .login-branding-enter {
          animation: 0.8s ease-out both login-fade-in;
        }
        .login-feature-enter {
          animation: 0.5s cubic-bezier(0.16, 1, 0.3, 1) both login-slide-right;
        }
      `}</style>

      <div className="relative flex min-h-screen" style={{ background: "var(--login-bg)" }}>
        {/* Left panel - Brand */}
        <div className="login-branding-enter relative hidden flex-col justify-between overflow-hidden lg:flex lg:w-[52%]">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(to bottom right, var(--login-bg), var(--login-bg-secondary), var(--login-bg-surface))` }} />

          {/* Circuit dot pattern */}
          <div className="login-circuit-pattern absolute inset-0" />

          {/* Floating orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[10%] top-[15%] h-[500px] w-[500px] rounded-full opacity-[0.06] blur-[140px]" style={{ background: "var(--login-accent)", animation: "orb-drift-1 28s ease-in-out infinite" }} />
            <div className="absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full opacity-[0.05] blur-[140px]" style={{ background: "var(--login-accent-secondary)", animation: "orb-drift-2 32s ease-in-out infinite" }} />
            <div className="absolute left-[50%] top-[55%] h-[350px] w-[350px] rounded-full opacity-[0.025] blur-[120px]" style={{ background: "#d97706", animation: "orb-drift-3 25s ease-in-out infinite" }} />
          </div>

          {/* Circuit SVG overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
            <CircuitSvg />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-1 flex-col justify-center px-16 xl:px-20">
            <div className="max-w-md">
              {/* Brand icon */}
              <div className="mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-white/60 backdrop-blur-sm" style={{ borderColor: "var(--login-border-medium)" }}>
                  <BrandIcon />
                </div>
              </div>

              {/* Title */}
              <h1 className="login-gradient-text mb-3 text-4xl font-bold tracking-tight xl:text-5xl">
                Stacktalk
              </h1>
              <p className="mb-12 text-lg leading-relaxed" style={{ color: "var(--login-text-secondary)" }}>
                AI-Powered Conversational App Builder
              </p>

              {/* Features */}
              <div className="flex flex-col gap-5">
                <div className="login-feature-enter flex items-center gap-4" style={{ animationDelay: "0.3s" }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white/40" style={{ borderColor: "var(--login-border-subtle)" }}>
                    <PipelineIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--login-text-primary)" }}>Conversational Building</p>
                    <p className="text-xs" style={{ color: "var(--login-text-muted)" }}>Turn ideas into apps through natural dialogue</p>
                  </div>
                </div>
                <div className="login-feature-enter flex items-center gap-4" style={{ animationDelay: "0.45s" }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white/40" style={{ borderColor: "var(--login-border-subtle)" }}>
                    <UserIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--login-text-primary)" }}>Parallel AI Agents</p>
                    <p className="text-xs" style={{ color: "var(--login-text-muted)" }}>Specialized agents working in parallel</p>
                  </div>
                </div>
                <div className="login-feature-enter flex items-center gap-4" style={{ animationDelay: "0.6s" }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white/40" style={{ borderColor: "var(--login-border-subtle)" }}>
                    <MonitorIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--login-text-primary)" }}>Real-Time Collaboration</p>
                    <p className="text-xs" style={{ color: "var(--login-text-muted)" }}>Live dashboard and task management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom branding */}
          <div className="relative z-10 px-16 pb-8 xl:px-20">
            <div className="border-t pt-6" style={{ borderColor: "var(--login-border-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--login-text-muted)" }}>Autonomous AI workforce management</p>
            </div>
          </div>

          {/* Right edge line */}
          <div className="absolute right-0 top-0 bottom-0 w-px" style={{ background: `linear-gradient(to bottom, transparent, var(--login-border-medium), transparent)` }} />
        </div>

        {/* Right panel - Login form */}
        <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden">
          {/* Background orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[15%] top-[20%] h-[400px] w-[400px] rounded-full opacity-[0.04] blur-[120px]" style={{ background: "var(--login-accent)", animation: "orb-drift-1 28s ease-in-out infinite" }} />
            <div className="absolute bottom-[15%] right-[20%] h-[350px] w-[350px] rounded-full opacity-[0.03] blur-[120px]" style={{ background: "var(--login-accent-secondary)", animation: "orb-drift-2 32s ease-in-out infinite" }} />
          </div>

          <div className="login-card-enter relative z-10 w-full max-w-[440px] px-6">
            {/* Mobile brand icon */}
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-white/60 backdrop-blur-sm" style={{ borderColor: "var(--login-border-medium)" }}>
                <BrandIcon />
              </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl border bg-white/80 shadow-2xl shadow-black/40 backdrop-blur-xl" style={{ borderColor: "var(--login-border-subtle)" }}>
              <div className="px-8 pb-8 pt-10 sm:px-10">
                {/* Header */}
                <div className="mb-8 text-center">
                  <h1 className="login-gradient-text mb-2 text-[26px] font-bold tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-[13px]" style={{ color: "var(--login-text-muted)" }}>
                    Sign in to your Stacktalk account
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                  {/* Email */}
                  <div>
                    <label htmlFor="login-email" className="mb-2 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--login-text-muted)" }}>
                      Email
                    </label>
                    <div className="relative" suppressHydrationWarning>
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--login-text-muted)" }}>
                        <EmailIcon />
                      </div>
                      <input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="login-input-depth w-full rounded-lg border py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-[#7d89a8]"
                        style={{
                          borderColor: "var(--login-border-medium)",
                          background: "var(--login-bg-surface)",
                          color: "var(--login-text-primary)",
                        }}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="login-password" className="mb-2 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--login-text-muted)" }}>
                      Password
                    </label>
                    <div className="relative" suppressHydrationWarning>
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--login-text-muted)" }}>
                        <LockIcon />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="login-input-depth w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-[#7d89a8]"
                        style={{
                          borderColor: "var(--login-border-medium)",
                          background: "var(--login-bg-surface)",
                          color: "var(--login-text-primary)",
                        }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label="Show password"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                        style={{ color: "var(--login-text-muted)" }}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="group flex cursor-pointer items-center gap-2.5 text-[13px]" style={{ color: "var(--login-text-secondary)" }}>
                      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span
                          className="absolute inset-0 rounded-[5px] border transition-all peer-checked:border-[var(--login-accent)] peer-checked:bg-[var(--login-accent)]"
                          style={{ borderColor: "var(--login-border-medium)", background: "var(--login-bg-surface)" }}
                        />
                        <svg className="relative z-10 h-2.5 w-2.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="text-[13px] transition-colors hover:opacity-80"
                      style={{ color: "var(--login-accent)" }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="login-btn-glow mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 focus:ring-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: `linear-gradient(to right, var(--login-accent), var(--login-accent-secondary))`,
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  {/* Enter hint */}
                  <p className="text-center text-[11px]" style={{ color: "var(--login-text-muted)" }}>
                    Press{" "}
                    <kbd className="rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium" style={{ borderColor: "var(--login-border-medium)", background: "var(--login-bg-surface)", color: "var(--login-text-secondary)" }}>
                      Enter
                    </kbd>{" "}
                    to sign in
                  </p>
                </form>

                {/* Divider */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "var(--login-border-subtle)" }} />
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--login-text-muted)" }}>or</span>
                  <div className="h-px flex-1" style={{ background: "var(--login-border-subtle)" }} />
                </div>

                {/* Request access */}
                <p className="mt-5 text-center text-[13px]" style={{ color: "var(--login-text-muted)" }}>
                  Don&apos;t have an account?{" "}
                  <button
                    className="font-medium transition-colors hover:opacity-80"
                    style={{ color: "var(--login-accent)" }}
                  >
                    Request access
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
