"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

interface Listing { id: string; brand: string; model: string; manufacturing_year: number; status: string; price: string; }

export default function DashboardPage() {
  const { user, loading } = useAuth(); const [listings, setListings] = useState<Listing[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (user) apiClient<Listing[]>("/listings/mine").then(setListings).catch(() => setError("Your listings could not be loaded.")); }, [user]);
  if (loading) return <><SiteHeader /><main className="p-10">Loading account…</main></>;
  if (!user) return <><SiteHeader /><main className="mx-auto max-w-xl p-10"><h1 className="text-3xl font-bold">Sign in required</h1><Link className="mt-5 inline-block rounded bg-ink px-4 py-2 text-white" href="/login">Sign in</Link></main></>;
  return <><SiteHeader /><main className="mx-auto max-w-5xl px-6 py-12"><p className="text-sm text-slate-500">{user.email}</p><div className="mt-2 flex items-center justify-between"><h1 className="font-display text-4xl font-bold">My cars</h1><Link className="rounded-lg bg-ink px-4 py-3 font-semibold text-white" href="/sell">Add a car</Link></div>{error && <p className="mt-6 rounded bg-red-50 p-4 text-red-700">{error}</p>}{!error && listings.length === 0 && <p className="mt-8 rounded-xl border border-dashed p-6 text-slate-600">You have not created any listings yet.</p>}<div className="mt-7 space-y-3">{listings.map((listing) => <article key={listing.id} className="flex items-center justify-between rounded-xl border bg-white p-5"><div><h2 className="font-bold">{listing.manufacturing_year} {listing.brand} {listing.model}</h2><p className="text-sm capitalize text-slate-500">{listing.status.replace("_", " ")} · ₹{Number(listing.price).toLocaleString("en-IN")}</p></div><Link className="font-semibold text-ember" href={`/dashboard/listings/${listing.id}`}>Manage</Link></article>)}</div></main></>;
}
