"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";

const selectOptions = {
  fuel_type: ["petrol", "diesel", "cng", "electric", "hybrid"],
  transmission: ["manual", "automatic", "amt", "cvt", "dct"],
  body_type: ["hatchback", "sedan", "suv", "muv", "coupe", "wagon"]
};
const inputNames = ["brand", "model", "variant", "manufacturing_year", "registration_year", "price", "kilometers_driven", "color", "owner_count", "city", "state"];
const numericNames = new Set(["manufacturing_year", "registration_year", "price", "kilometers_driven", "owner_count"]);
const optionalNames = new Set(["variant", "registration_year", "color"]);

export default function SellPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError(null);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const listing = await apiClient<{ id: string }>("/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, manufacturing_year: Number(fields.manufacturing_year), registration_year: fields.registration_year ? Number(fields.registration_year) : null, price: Number(fields.price), kilometers_driven: Number(fields.kilometers_driven), owner_count: Number(fields.owner_count), features: String(fields.features).split(",").map((value) => value.trim()).filter(Boolean), seller_type: "individual" }) });
      router.push(`/dashboard/listings/${listing.id}`);
    } catch { setError("The listing could not be saved. Please review the details and try again."); }
    finally { setSubmitting(false); }
  }

  if (loading) return <><SiteHeader /><main className="p-10">Loading…</main></>;
  if (!user) return <><SiteHeader /><main className="mx-auto max-w-xl p-10"><h1 className="text-3xl font-bold">Sign in to sell your car</h1><a className="mt-5 inline-block rounded bg-ink px-4 py-2 text-white" href="/login">Sign in</a></main></>;

  return <><SiteHeader /><main className="mx-auto max-w-2xl px-6 py-12"><h1 className="font-display text-4xl font-bold">Add your car</h1><p className="mt-3 text-slate-600">Save as a draft first, then submit it for review.</p><form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={submit}>{inputNames.map((name) => <label key={name} className="text-sm font-medium capitalize">{name.replaceAll("_", " ")}<input className="mt-1 w-full rounded-lg border p-3" name={name} type={numericNames.has(name) ? "number" : "text"} required={!optionalNames.has(name)} min={name === "manufacturing_year" ? 1886 : name === "owner_count" ? 0 : undefined} /></label>)}{Object.entries(selectOptions).map(([name, values]) => <label key={name} className="text-sm font-medium capitalize">{name.replaceAll("_", " ")}<select className="mt-1 w-full rounded-lg border p-3" name={name}>{values.map((value) => <option key={value}>{value}</option>)}</select></label>)}<label className="text-sm font-medium sm:col-span-2">Features, separated by commas<input className="mt-1 w-full rounded-lg border p-3" name="features" /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea className="mt-1 min-h-32 w-full rounded-lg border p-3" name="description" minLength={20} required /></label>{error && <p className="sm:col-span-2 rounded bg-red-50 p-3 text-red-700">{error}</p>}<button disabled={submitting} className="sm:col-span-2 rounded-lg bg-ink p-3 font-semibold text-white disabled:opacity-60">{submitting ? "Saving…" : "Save draft"}</button></form></main></>;
}
