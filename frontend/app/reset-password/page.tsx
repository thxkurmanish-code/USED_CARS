"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { apiClient } from "@/services/api-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify your new password entry.");
      setLoading(false);
      return;
    }

    try {
      await apiClient("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      setSuccess(true);
    } catch {
      setError("Failed to reset password. Token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-bold text-slate-900">Reset Password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter a new secure password for your account.</p>

      {success ? (
        <div className="mt-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            ✓
          </div>
          <p className="text-sm font-bold text-slate-900">Password Reset Successful!</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800"
          >
            Sign In Now
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold uppercase text-slate-700">
            Reset Token *
            <input
              type="text"
              required
              value={token}
              readOnly
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono"
            />
          </label>

          <div className="relative">
            <label className="block text-xs font-semibold uppercase text-slate-700">
              New Password *
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 12 characters (letters & numbers)"
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 pr-12 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-8 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              {showPassword ? "👁️ Hide" : "👁️ Show"}
            </button>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold uppercase text-slate-700">
              Confirm New Password *
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 pr-12 text-sm focus:border-slate-900 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-3 top-8 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              {showConfirmPassword ? "👁️ Hide" : "👁️ Show"}
            </button>
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Suspense fallback={<p className="text-center text-slate-500">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </>
  );
}
