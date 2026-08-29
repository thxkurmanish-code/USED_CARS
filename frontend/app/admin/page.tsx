"use client";

import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

interface Listing { id: string; brand: string; model: string; manufacturing_year: number; description: string; created_at: string; }
export default function AdminPage() {
  const { user, loading } = useAuth(); const [items, setItems] = useState<Listing[]>([]); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState<string | null>(null);
  const load = () => apiClient<Listing[]>("/admin/listings/pending").then(setItems).catch(() => setError("Pending listings could not be loaded."));
  useEffect(() => { if (user?.role === "admin") void load(); }, [user]);
  async function review(id: string, action: "approve" | "reject") { setBusy(id); try { if (action === "reject") { const reason = window.prompt("Reason for rejection (shown to seller):"); if (!reason) return; await apiClient(`/admin/listings/${id}/reject?reason=${encodeURIComponent(reason)}`, { method: "POST" }); } else { await apiClient(`/admin/listings/${id}/approve`, { method: "POST" }); } await load(); } catch { setError("The review action could not be completed."); } finally { setBusy(null); } }
  if (loading) return <main className="p-8">Loading…</main>;
  if (!user || user.role !== "admin") return <><SiteHeader /><main className="mx-auto max-w-xl p-10"><h1 className="text-3xl font-bold">Admin access required</h1><p className="mt-3 text-slate-600">Sign in with an administrator account.</p></main></>;
  return <><SiteHeader /><main className="mx-auto max-w-5xl px-6 py-12"><h1 className="font-display text-4xl font-bold">Listing review</h1>{error && <p className="mt-5 rounded bg-red-50 p-4 text-red-700">{error}</p>}{items.length === 0 ? <p className="mt-6 rounded border border-dashed p-6 text-slate-600">No listings are waiting for review.</p> : <div className="mt-7 space-y-4">{items.map((item) => <article className="rounded-xl border bg-white p-5" key={item.id}><h2 className="font-bold">{item.manufacturing_year} {item.brand} {item.model}</h2><p className="mt-2 text-slate-600">{item.description}</p><div className="mt-4 flex gap-3"><button disabled={busy === item.id} className="rounded bg-ink px-4 py-2 font-semibold text-white" onClick={() => void review(item.id, "approve")}>Approve</button><button disabled={busy === item.id} className="rounded border px-4 py-2 font-semibold" onClick={() => void review(item.id, "reject")}>Reject</button></div></article>)}</div>}</main></>;
}
