"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";
import { ListingDetail } from "@/types/api";

const selectOptions = {
  fuel_type: ["petrol", "diesel", "cng", "electric", "hybrid"],
  transmission: ["manual", "automatic", "amt", "cvt", "dct"],
  body_type: ["hatchback", "sedan", "suv", "muv", "coupe", "wagon"],
};

export default function SellPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const formElement = event.currentTarget;
    const fields = Object.fromEntries(new FormData(formElement));

    try {
      // 1. Create Car Listing
      const newCar = await apiClient<ListingDetail>("/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: fields.brand,
          model: fields.model,
          variant: fields.variant || undefined,
          manufacturing_year: Number(fields.manufacturing_year),
          registration_year: fields.registration_year ? Number(fields.registration_year) : Number(fields.manufacturing_year),
          price: Number(fields.price),
          kilometers_driven: Number(fields.kilometers_driven),
          fuel_type: fields.fuel_type,
          transmission: fields.transmission,
          body_type: fields.body_type,
          color: fields.color || undefined,
          owner_count: Number(fields.owner_count),
          city: fields.city,
          state: fields.state,
          description: fields.description || "Vehicle in good condition.",
          features: String(fields.features || "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          seller_type: "individual",
        }),
      });

      // 2. Upload multiple photos if selected
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("files", file);
          try {
            await apiClient(`/listings/${newCar.id}/images`, {
              method: "POST",
              body: formData,
            });
          } catch {
            // continue uploading remaining photos
          }
        }
      }



      router.push(`/dashboard`);
    } catch {
      setError("The listing could not be saved. Please review the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="p-10 text-center text-slate-500">Loading…</main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Sign in to Sell</h1>
          <p className="mt-2 text-sm text-slate-600">List your car to reach thousands of verified buyers.</p>
          <a
            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
            href="/login"
          >
            Sign In Now
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Sell Your Car</h1>
        <p className="mt-2 text-sm text-slate-600">Fill in your vehicle specifications and attach multiple photos directly below.</p>

        <form className="mt-8 grid gap-5 rounded-3xl border bg-white p-6 shadow-sm sm:grid-cols-2" onSubmit={submit}>
          <label className="text-xs font-semibold text-slate-700 uppercase">
            Brand *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="brand" placeholder="e.g. Maruti, BMW" required />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase">
            Model *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="model" placeholder="e.g. Swift, 3 Series" required />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase">
            Variant
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="variant" placeholder="e.g. VXI, ZXI" />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase">
            Manufacturing Year *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="manufacturing_year" type="number" min={1980} max={2026} defaultValue={2020} required />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase">
            Asking Price (₹) *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="price" type="number" min={1000} required placeholder="e.g. 550000" />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase">
            Kilometers Driven *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="kilometers_driven" type="number" min={0} required placeholder="e.g. 45000" />
          </label>

          {Object.entries(selectOptions).map(([name, values]) => (
            <label key={name} className="text-xs font-semibold text-slate-700 uppercase">
              {name.replaceAll("_", " ")} *
              <select className="mt-1.5 w-full rounded-xl border p-3 text-sm capitalize focus:outline-none focus:border-slate-900" name={name}>
                {values.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="text-xs font-semibold text-slate-700 uppercase">
            Owner Count *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="owner_count" type="number" min={1} max={10} defaultValue={1} required />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase">
            City *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="city" placeholder="e.g. Noida, Mumbai" required />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase">
            State *
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="state" placeholder="e.g. Uttar Pradesh" required />
          </label>

          {/* Main Cover Photo Upload Field */}
          <label className="text-xs font-semibold text-slate-700 uppercase sm:col-span-2">
            Vehicle Cover Photo (Select 1 Image)
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1.5 w-full rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-600 bg-slate-50 cursor-pointer hover:bg-slate-100"
            />
            {selectedFiles.length > 0 && (
              <p className="mt-2 text-xs font-bold text-emerald-600">
                ✓ Cover photo selected ({selectedFiles[0]?.name}). Additional photos can be added on the car page anytime!
              </p>
            )}
          </label>


          <label className="text-xs font-semibold text-slate-700 uppercase sm:col-span-2">
            Features (comma separated)
            <input className="mt-1.5 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="features" placeholder="Sunroof, Power Steering, Music System" />
          </label>

          <label className="text-xs font-semibold text-slate-700 uppercase sm:col-span-2">
            Description *
            <textarea className="mt-1.5 min-h-24 w-full rounded-xl border p-3 text-sm focus:outline-none focus:border-slate-900" name="description" required placeholder="Describe vehicle condition, service history, and reason for selling." />
          </label>

          {error && <p className="sm:col-span-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          <button
            disabled={submitting}
            className="sm:col-span-2 rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-lg hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Saving & Uploading Photos..." : "Create & Upload Listing"}
          </button>
        </form>
      </main>
    </>
  );
}
