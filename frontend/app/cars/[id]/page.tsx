"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

interface Listing { id: string; brand: string; model: string; manufacturing_year: number; price: string; kilometers_driven: number; fuel_type: string; transmission: string; body_type: string; city: string; state: string; description: string; features: string[]; seller_type: string; }
export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>(); const { user } = useAuth(); const [car, setCar] = useState<Listing | null>(null); const [error, setError] = useState<string | null>(null); const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { apiClient<Listing>(`/listings/${id}`).then(setCar).catch(() => setError("This car is unavailable or no longer listed.")); }, [id]);
  async function save() { try { await apiClient(`/wishlist/${id}`, { method: "PUT" }); setMessage("Saved to your wishlist."); } catch { setMessage("Please sign in to save this car."); } }
  async function enquire(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await apiClient(`/listings/${id}/enquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: form.get("message") }) }); setMessage("Your enquiry was sent to the seller."); event.currentTarget.reset(); } catch { setMessage("Please sign in before sending an enquiry."); } }
  return <><SiteHeader /><main className="mx-auto max-w-4xl px-6 py-12">{error ? <p className="rounded bg-amber-50 p-4">{error} <Link className="font-semibold" href="/cars">Browse cars</Link></p> : !car ? <p>Loading car…</p> : <><p className="text-sm capitalize text-slate-500">{car.seller_type} seller · {car.city}, {car.state}</p><h1 className="mt-2 font-display text-4xl font-bold">{car.manufacturing_year} {car.brand} {car.model}</h1><p className="mt-5 text-3xl font-bold">₹{Number(car.price).toLocaleString("en-IN")}</p><div className="mt-7 grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-4"><span>{car.kilometers_driven.toLocaleString("en-IN")} km</span><span className="capitalize">{car.fuel_type}</span><span className="capitalize">{car.transmission}</span><span className="capitalize">{car.body_type}</span></div><p className="mt-7 leading-7 text-slate-700">{car.description}</p><div className="mt-5 flex flex-wrap gap-2">{car.features.map((feature) => <span className="rounded-full bg-slate-100 px-3 py-1 text-sm" key={feature}>{feature}</span>)}</div>{user && <button className="mt-7 rounded-lg border px-4 py-3 font-semibold" onClick={() => void save()}>Save to wishlist</button>}<form className="mt-8 rounded-xl border p-5" onSubmit={enquire}><h2 className="text-xl font-bold">Contact seller</h2><textarea className="mt-4 min-h-28 w-full rounded border p-3" name="message" minLength={10} placeholder="Ask about availability, history, or a viewing." required /><button className="mt-3 rounded bg-ink px-4 py-3 font-semibold text-white">Send enquiry</button></form>{message && <p className="mt-4 rounded bg-slate-100 p-3">{message}</p>}</>}</main></>;
}
