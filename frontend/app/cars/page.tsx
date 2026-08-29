"use client";

import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { apiClient } from "@/services/api-client";

interface Listing { id: string; brand: string; model: string; manufacturing_year: number; price: string; kilometers_driven: number; city: string; state: string; seller_type: string; }
interface ListingPage { items: Listing[]; total: number; }

export default function CarsPage() {
  const [data, setData] = useState<ListingPage>({ items: [], total: 0 });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { apiClient<ListingPage>("/listings").then(setData).catch(() => setError("Cars are temporarily unavailable. Please try again shortly.")); }, []);
  return <><SiteHeader /><main className="mx-auto max-w-6xl px-6 py-12 sm:px-10"><p className="text-sm font-semibold uppercase tracking-[.2em] text-ember">Available cars</p><h1 className="mt-3 font-display text-4xl font-bold">Find the right next car.</h1>{error ? <p className="mt-8 rounded-xl bg-amber-50 p-4 text-amber-900">{error}</p> : <p className="mt-4 text-slate-600">{data.total} vehicles currently listed.</p>}<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((car) => <article className="rounded-2xl border border-slate-200 bg-white p-5" key={car.id}><p className="text-sm text-slate-500">{car.manufacturing_year} · {car.city}</p><h2 className="mt-1 text-xl font-bold">{car.brand} {car.model}</h2><p className="mt-4 text-lg font-semibold">₹{Number(car.price).toLocaleString("en-IN")}</p><p className="mt-1 text-sm text-slate-500">{car.kilometers_driven.toLocaleString("en-IN")} km · {car.seller_type}</p></article>)}</div></main></>;
}
