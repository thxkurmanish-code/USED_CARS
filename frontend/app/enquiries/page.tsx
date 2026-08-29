"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

interface Enquiry { id: string; listing_id: string; buyer_id: string; seller_id: string; message: string; status: string; created_at: string; }
export default function EnquiriesPage() {
  const { user, loading } = useAuth(); const [items, setItems] = useState<Enquiry[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (user) apiClient<Enquiry[]>("/enquiries").then(setItems).catch(() => setError("Enquiries could not be loaded.")); }, [user]);
  if (loading) return <main className="p-8">Loading…</main>;
  return <><SiteHeader /><main className="mx-auto max-w-4xl px-6 py-12"><h1 className="font-display text-4xl font-bold">Enquiries</h1>{!user ? <p className="mt-6">Sign in to view enquiries.</p> : error ? <p className="mt-6 rounded bg-red-50 p-4">{error}</p> : items.length === 0 ? <p className="mt-6 rounded border border-dashed p-6 text-slate-600">No enquiries yet.</p> : <div className="mt-7 space-y-3">{items.map((item) => <article className="rounded-xl border bg-white p-5" key={item.id}><p className="text-sm capitalize text-slate-500">{item.status.replace("_", " ")} · {new Date(item.created_at).toLocaleString()}</p><p className="mt-2">{item.message}</p></article>)}</div>}</main></>;
}
