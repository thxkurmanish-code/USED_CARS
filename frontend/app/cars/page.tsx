"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { TrustBadge } from "@/components/trust-badge";
import { getImageUrl } from "@/lib/image-url";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";
import { ListingPage } from "@/types/api";

const fuelOptions = ["petrol", "diesel", "cng", "electric", "hybrid"];
const transmissionOptions = ["manual", "automatic", "amt", "cvt", "dct"];
const bodyTypeOptions = ["hatchback", "sedan", "suv", "muv", "coupe"];

export default function CarsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ListingPage>({ items: [], total: 0, page: 1, page_size: 20 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(queryString = "") {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<ListingPage>(`/listings${queryString}`);
      setData(res);
    } catch {
      setError("Cars are temporarily unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleRemoveCar(e: React.MouseEvent, carId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this vehicle from the marketplace?")) return;
    try {
      await apiClient(`/listings/${carId}`, { method: "DELETE" });
      void load();
    } catch {
      alert("Failed to remove car listing.");
    }
  }

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    [
      "q",
      "brand",
      "city",
      "fuel_type",
      "transmission",
      "body_type",
      "min_price",
      "max_price",
      "min_year",
      "max_year",
      "max_km",
      "sort_by",
    ].forEach((key) => {
      const val = String(form.get(key) ?? "").trim();
      if (val) params.set(key, val);
    });

    void load(params.toString() ? `?${params.toString()}` : "");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Dream Inventory</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Browse Pre-Owned Cars
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500">{data.total} verified vehicles listed</p>
        </div>

        {/* Filter Panel */}
        <form onSubmit={handleFilter} className="mt-6 rounded-3xl border bg-white p-5 shadow-sm space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <input
              name="q"
              placeholder="Search keyword..."
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
            />
            <input
              name="brand"
              placeholder="Brand (e.g. BMW, Toyota)"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
            />
            <input
              name="city"
              placeholder="City (e.g. Mumbai, Delhi)"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
            />

            <select
              name="fuel_type"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm capitalize focus:border-slate-900 focus:outline-none"
            >
              <option value="">All Fuel Types</option>
              {fuelOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <select
              name="transmission"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm capitalize focus:border-slate-900 focus:outline-none"
            >
              <option value="">All Transmissions</option>
              {transmissionOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              name="body_type"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm capitalize focus:border-slate-900 focus:outline-none"
            >
              <option value="">All Body Types</option>
              {bodyTypeOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <input
                type="number"
                name="min_price"
                placeholder="Min Price (₹)"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none sm:w-36"
              />
              <input
                type="number"
                name="max_price"
                placeholder="Max Price (₹)"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none sm:w-36"
              />
              <select
                name="sort_by"
                className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none sm:w-44"
              >
                <option value="">Sort: Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="mileage_asc">Mileage: Lowest First</option>
                <option value="year_desc">Year: Newest First</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white shadow hover:bg-slate-800"
            >
              Apply Filters
            </button>
          </div>
        </form>

        {/* Results grid */}
        {loading ? (
          <div className="mt-12 text-center text-slate-500">Loading vehicles…</div>
        ) : error ? (
          <div className="mt-8 rounded-2xl bg-amber-50 p-6 text-amber-900">{error}</div>
        ) : data.items.length === 0 ? (
          <div className="mt-12 rounded-3xl border-2 border-dashed p-12 text-center">
            <p className="text-lg font-bold text-slate-700">No vehicles match these filters</p>
            <p className="mt-1 text-sm text-slate-500">Try broadening your search or clearing price/location constraints.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((car) => {
              const coverImg = car.images && car.images.length > 0 ? car.images[0].storage_key : null;
              const isOwnerOrAdmin = user && (user.role === "admin" || user.id === car.owner_id);

              return (
                <div key={car.id} className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all hover:shadow-xl">
                  <Link href={`/cars/${car.id}`} className="group flex flex-col flex-1">
                    {/* Photo Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img
                        src={getImageUrl(coverImg)}
                        alt={`${car.brand} ${car.model}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <TrustBadge isVerified={car.is_verified} sellerType={car.seller_type} />
                      </div>
                      <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                        {car.city}
                      </span>
                    </div>

                    {/* Car info */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>{car.manufacturing_year}</span>
                        <span className="capitalize">{car.seller_type}</span>
                      </div>

                      <h3 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {car.brand} {car.model}
                      </h3>
                      {car.variant && <p className="text-xs text-slate-500 truncate">{car.variant}</p>}

                      <div className="mt-4 flex items-baseline justify-between">
                        <p className="text-xl font-extrabold text-slate-900">
                          ₹{Number(car.price).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs font-medium text-slate-500">
                        <span className="rounded bg-slate-100 px-2 py-1">{car.kilometers_driven.toLocaleString("en-IN")} km</span>
                        <span className="rounded bg-slate-100 px-2 py-1 capitalize">{car.fuel_type}</span>
                        <span className="rounded bg-slate-100 px-2 py-1 capitalize">{car.transmission}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between border-t bg-slate-50 p-3">
                    <Link
                      href={`/cars/${car.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-emerald-600"
                    >
                      View Details →
                    </Link>

                    {isOwnerOrAdmin && (
                      <button
                        onClick={(e) => void handleRemoveCar(e, car.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                      >
                        🗑 Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
