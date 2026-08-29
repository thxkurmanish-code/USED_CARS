"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) }); setMessage(response.ok ? "Signed in successfully. Account pages will be added next." : "We could not sign you in. Check your details and try again."); }
  return <><SiteHeader /><main className="mx-auto max-w-md px-6 py-16"><h1 className="font-display text-4xl font-bold">Welcome back.</h1><form className="mt-8 space-y-4" onSubmit={submit}><input className="w-full rounded-lg border p-3" name="email" type="email" placeholder="Email" required /><input className="w-full rounded-lg border p-3" name="password" type="password" placeholder="Password" required /><button className="w-full rounded-lg bg-ink p-3 font-semibold text-white">Sign in</button></form>{message && <p className="mt-4 text-sm text-slate-600">{message}</p>}<p className="mt-5 text-sm">New here? <Link className="font-semibold text-ember" href="/register">Create an account</Link></p></main></>;
}
