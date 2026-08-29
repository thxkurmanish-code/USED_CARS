"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { apiClient } from "@/services/api-client";

interface Listing { id: string; brand: string; model: string; manufacturing_year: number; price: string; kilometers_driven: number; city: string; state: string; seller_type: string; }
interface ListingPage { items: Listing[]; total: number; }

export default function CarsPage() {
  const [data, setData] = useState<ListingPage>({ items: [], total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  async function load(query = "") { setLoading(true); setError(null); try { setData(await apiClient<ListingPage>(`/listings${query}`)); } catch { setError("Cars are temporarily unavailable. Please try again shortly."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  function filter(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const params = new URLSearchParams(); ["brand", "city", "min_price", "max_price"].forEach((key) => { const value = String(form.get(key) ?? "").trim(); if (value) params.set(key, value); }); void load(params.size ? `?${params}` : ""); }
  return <><SiteHeader /><main className="mx-auto max-w-6xl px-6 py-12 sm:px-10"><p className="text-sm font-semibold uppercase tracking-[.2em] text-ember">Available cars</p><h1 className="mt-3 font-display text-4xl font-bold">Find the right next car.</h1><form className="mt-7 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-5" onSubmit={filter}><input className="rounded border p-3" name="brand" placeholder="Brand" /><input className="rounded border p-3" name="city" placeholder="City" /><input className="rounded border p-3" name="min_price" type="number" placeholder="Min price" /><input className="rounded border p-3" name="max_price" type="number" placeholder="Max price" /><button className="rounded bg-ink p-3 font-semibold text-white">Search</button></form>{loading ? <p className="mt-8 text-slate-600">Loading cars…</p> : error ? <p className="mt-8 rounded-xl bg-amber-50 p-4 text-amber-900">{error}</p> : <><p className="mt-5 text-slate-600">{data.total} vehicles currently listed.</p>{data.items.length === 0 ? <p className="mt-8 rounded-xl border border-dashed p-6 text-slate-600">No cars match these filters yet. Try broadening your search.</p> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((car) => <Link className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md" key={car.id} href={`/cars/${car.id}`}><p className="text-sm text-slate-500">{car.manufacturing_year} · {car.city}</p><h2 className="mt-1 text-xl font-bold">{car.brand} {car.model}</h2><p className="mt-4 text-lg font-semibold">₹{Number(car.price).toLocaleString("en-IN")}</p><p className="mt-1 text-sm text-slate-500">{car.kilometers_driven.toLocaleString("en-IN")} km · {car.seller_type}</p></Link>)}</div>}</>}</main></>;
}
