"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { TrustBadge } from "@/components/trust-badge";
import { getImageUrl } from "@/lib/image-url";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";
import { ListingSummary } from "@/types/api";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadWishlist() {
    setLoading(true);
    try {
      const data = await apiClient<ListingSummary[]>("/wishlist");
      setWishlist(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      void loadWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function handleRemove(listingId: string) {
    try {
      await apiClient(`/wishlist/${listingId}`, { method: "DELETE" });
      setWishlist((prev) => prev.filter((item) => item.id !== listingId));
    } catch {
      // ignore
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <SiteHeader />
        <main className="p-10 text-center text-slate-500">Loading saved cars…</main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md p-10 text-center">
          <h1 className="text-3xl font-bold">Saved Wishlist</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to save and compare your favorite vehicles.</p>
          <a className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white" href="/login">
            Sign In
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Your Saved Wishlist</h1>
        <p className="mt-1 text-sm text-slate-500">{wishlist.length} saved vehicles</p>

        {wishlist.length === 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed p-12 text-center bg-white">
            <p className="text-lg font-bold text-slate-700">Your Wishlist is Empty</p>
            <p className="mt-1 text-sm text-slate-500">Explore the marketplace and bookmark cars you like.</p>
            <Link href="/cars" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white">
              Browse Cars
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((car) => {
              const coverImg = car.images && car.images.length > 0 ? car.images[0].storage_key : null;
              return (
                <div key={car.id} className="group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm">
                  <div className="relative aspect-[16/10] bg-slate-100">
                    {(() => {
                      const imgUrl = getImageUrl(coverImg);
                      return imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={car.model}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement?.querySelector(".no-img-placeholder")?.classList.remove("hidden");
                          }}
                          className="h-full w-full object-cover"
                        />
                      ) : null;
                    })()}
                    <div className={`no-img-placeholder absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold ${getImageUrl(coverImg) ? "hidden" : ""}`}>
                      No image available
                    </div>
                    <div className="absolute top-3 left-3 z-10">
                      <TrustBadge isVerified={car.is_verified} sellerType={car.seller_type} />
                    </div>
                    <button
                      onClick={() => handleRemove(car.id)}
                      className="absolute top-3 right-3 rounded-full bg-slate-900/80 p-2 text-xs text-white hover:bg-red-600"
                      title="Remove from wishlist"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-slate-900">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-xl font-extrabold text-slate-900 mt-2">
                      ₹{Number(car.price).toLocaleString("en-IN")}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <span className="text-xs text-slate-500">{car.city}</span>
                      <Link href={`/cars/${car.id}`} className="text-xs font-bold text-slate-900 hover:underline">
                        View Details →
                      </Link>
                    </div>
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
