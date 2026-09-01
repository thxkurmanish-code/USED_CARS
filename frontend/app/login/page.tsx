"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  const { refresh } = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiClient("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      router.push("/dashboard");
    } catch {
      setError("We could not sign you in. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="font-display text-3xl font-bold text-slate-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage your cars and enquiries.</p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-xs font-semibold uppercase text-slate-700">
              Email Address
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="name@example.com"
                required
              />
            </label>

            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-slate-900 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 pr-12 text-sm focus:border-slate-900 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-8 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                {showPassword ? "👁️ Hide" : "👁️ Show"}
              </button>
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            New here?{" "}
            <Link className="font-semibold text-slate-900 underline" href="/register">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
