"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

interface Listing { id: string; brand: string; model: string; manufacturing_year: number; status: string; price: string; description: string; variant: string | null; registration_year: number | null; kilometers_driven: number; fuel_type: string; transmission: string; body_type: string; color: string | null; owner_count: number; city: string; state: string; features: string[]; seller_type: string; }
export default function ListingManagePage() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const { user, loading } = useAuth(); const [listing, setListing] = useState<Listing | null>(null); const [description, setDescription] = useState(""); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) apiClient<Listing[]>("/listings/mine").then((items) => { const item = items.find((candidate) => candidate.id === params.id) ?? null; setListing(item); setDescription(item?.description ?? ""); }).catch(() => setError("Listing could not be loaded.")); }, [params.id, user]);
  async function action(path: string, method: "POST" | "DELETE") { setBusy(true); setError(null); try { await apiClient(`/listings/${params.id}${path}`, { method }); if (method === "DELETE") router.push("/dashboard"); else { const items = await apiClient<Listing[]>("/listings/mine"); setListing(items.find((item) => item.id === params.id) ?? null); } } catch { setError("That action could not be completed. Please try again."); } finally { setBusy(false); } }
  async function saveEdit() { if (!listing) return; setBusy(true); setError(null); try { const updated = await apiClient<Listing>(`/listings/${params.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...listing, description }) }); setListing(updated); setDescription(updated.description); } catch { setError("The description could not be updated. Please try again."); } finally { setBusy(false); } }
  if (loading) return <main className="p-8">Loading…</main>;
  if (!user) return <><SiteHeader /><main className="p-8"><Link href="/login">Sign in</Link></main></>;
  return <><SiteHeader /><main className="mx-auto max-w-2xl px-6 py-12">{error && <p className="mb-5 rounded bg-red-50 p-3 text-red-700">{error}</p>}{!listing ? <p>Listing not found.</p> : <><p className="text-sm capitalize text-slate-500">{listing.status.replace("_", " ")}</p><h1 className="mt-2 font-display text-4xl font-bold">{listing.manufacturing_year} {listing.brand} {listing.model}</h1><label className="mt-6 block text-sm font-semibold">Description<textarea className="mt-2 min-h-32 w-full rounded border p-3 font-normal" value={description} onChange={(event) => setDescription(event.target.value)} minLength={20} disabled={busy || !["draft", "rejected"].includes(listing.status)} /></label><button disabled={busy || !["draft", "rejected"].includes(listing.status)} className="mt-3 rounded-lg border px-4 py-3 font-semibold disabled:opacity-50" onClick={() => void saveEdit()}>Save edits</button><div className="mt-8 flex gap-3"><button disabled={busy || !["draft", "rejected"].includes(listing.status)} className="rounded-lg bg-ink px-4 py-3 font-semibold text-white disabled:opacity-50" onClick={() => void action("/submit", "POST")}>Submit for review</button><button disabled={busy} className="rounded-lg border px-4 py-3 font-semibold disabled:opacity-50" onClick={() => void action("", "DELETE")}>Archive listing</button></div></>}</main></>;
}
