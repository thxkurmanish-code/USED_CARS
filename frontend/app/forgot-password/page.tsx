"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { apiClient } from "@/services/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient<{ message: string; reset_token?: string }>("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-slate-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your email address to receive password reset instructions.</p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                If an account exists for {email}, password recovery instructions have been processed.
              </div>

              {resetToken && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <p className="font-bold">Development Fast Reset Link:</p>
                  <Link href={`/reset-password?token=${resetToken}`} className="mt-1 block font-mono underline text-amber-800 break-all">
                    /reset-password?token={resetToken}
                  </Link>
                </div>
              )}

              <Link href="/login" className="block text-center text-sm font-semibold text-slate-900 hover:underline">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-xs font-semibold uppercase text-slate-700">
                Email Address
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-slate-500 hover:text-slate-900">
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
