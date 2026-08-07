"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, "admin");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-500/15 text-terracotta-400">
            <ShieldCheck size={22} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide2 text-gold-400">
            Zevora Styles
          </p>
          <h1 className="mt-2 font-display text-3xl text-cream-50">Admin Portal</h1>
          <p className="mt-2 text-sm text-cream-200/60">
            Restricted access — store administrators only
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-cream-50/10 bg-white/[0.04] p-7 backdrop-blur"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cream-200/60">
                Admin Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zevora.com"
                className="w-full rounded-lg border border-cream-50/15 bg-cream-50/5 px-4 py-3 text-sm text-cream-50 placeholder:text-cream-200/30 focus:border-terracotta-400 focus:outline-none focus:ring-1 focus:ring-terracotta-400/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-cream-200/60">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-cream-50/15 bg-cream-50/5 px-4 py-3 text-sm text-cream-50 placeholder:text-cream-200/30 focus:border-terracotta-400 focus:outline-none focus:ring-1 focus:ring-terracotta-400/40"
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-terracotta-500 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-600 disabled:opacity-50"
          >
            <Lock size={14} />
            {loading ? "Signing in…" : "Sign In To Admin"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-cream-200/40">
          Looking for the storefront?{" "}
          <a href="/" className="text-cream-200/70 underline hover:text-cream-50">
            Go to Zevora Styles
          </a>
        </p>
      </div>
    </div>
  );
}
