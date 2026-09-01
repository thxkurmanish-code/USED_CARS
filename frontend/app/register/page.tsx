"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();
  const { refresh } = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password entry.");
      setSubmitting(false);
      return;
    }

    try {
      await apiClient("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          email,
          phone_number: phoneNumber || null,
          password,
        }),
      });
      await refresh();
      router.push("/dashboard");
    } catch {
      setError("Use a unique email address and a 12+ character password with letters and numbers.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="font-display text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="mt-2 text-sm text-slate-600">Join Dream Car Bazaar to save, list, and buy cars.</p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-xs font-semibold uppercase text-slate-700">
              Full Name *
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </label>

            <label className="block text-xs font-semibold uppercase text-slate-700">
              Email Address *
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="name@example.com"
                required
              />
            </label>

            <label className="block text-xs font-semibold uppercase text-slate-700">
              Phone Number
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                type="tel"
                placeholder="+91 98765 43210"
              />
            </label>

            <div className="relative">
              <label className="block text-xs font-semibold uppercase text-slate-700">
                Password *
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 pr-12 text-sm focus:border-slate-900 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  minLength={12}
                  placeholder="Min 12 chars (letters & numbers)"
                  required
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
                Confirm Password *
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 pr-12 text-sm focus:border-slate-900 focus:outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={12}
                  placeholder="Re-enter password"
                  required
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

            {error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            Already registered?{" "}
            <Link className="font-semibold text-slate-900 underline" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
