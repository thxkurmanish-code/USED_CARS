"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

interface Listing { id: string; brand: string; model: string; manufacturing_year: number; price: string; city: string; }
export default function WishlistPage() {
  const { user, loading } = useAuth(); const [items, setItems] = useState<Listing[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (user) apiClient<Listing[]>("/wishlist").then(setItems).catch(() => setError("Your saved cars could not be loaded.")); }, [user]);
  if (loading) return <main className="p-8">Loading…</main>;
  if (!user) return <><SiteHeader /><main className="p-8">Please <Link className="font-semibold" href="/login">sign in</Link> to view saved cars.</main></>;
  return <><SiteHeader /><main className="mx-auto max-w-5xl px-6 py-12"><h1 className="font-display text-4xl font-bold">Saved cars</h1>{error ? <p className="mt-6 rounded bg-red-50 p-4">{error}</p> : items.length === 0 ? <p className="mt-6 rounded border border-dashed p-6 text-slate-600">No saved cars yet.</p> : <div className="mt-7 grid gap-4 sm:grid-cols-2">{items.map((item) => <Link className="rounded-xl border bg-white p-5" href={`/cars/${item.id}`} key={item.id}><h2 className="font-bold">{item.manufacturing_year} {item.brand} {item.model}</h2><p>₹{Number(item.price).toLocaleString("en-IN")} · {item.city}</p></Link>)}</div>}</main></>;
}
