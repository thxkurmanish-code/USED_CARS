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
  const router = useRouter();
  const { refresh } = useAuth();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await apiClient("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      await refresh(); router.push("/dashboard");
    } catch { setError("We could not sign you in. Check your email and password."); }
    finally { setSubmitting(false); }
  }
  return <><SiteHeader /><main className="mx-auto max-w-md px-6 py-16"><h1 className="font-display text-4xl font-bold">Welcome back.</h1><form className="mt-8 space-y-4" onSubmit={submit}><label className="block text-sm font-medium">Email<input className="mt-1 w-full rounded-lg border p-3" name="email" type="email" required /></label><label className="block text-sm font-medium">Password<input className="mt-1 w-full rounded-lg border p-3" name="password" type="password" required /></label>{error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={submitting} className="w-full rounded-lg bg-ink p-3 font-semibold text-white disabled:opacity-60">{submitting ? "Signing in…" : "Sign in"}</button></form><p className="mt-5 text-sm">New here? <Link className="font-semibold text-ember" href="/register">Create an account</Link></p></main></>;
}
