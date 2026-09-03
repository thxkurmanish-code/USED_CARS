"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { TrustBadge } from "@/components/trust-badge";
import { ImageUploader } from "@/components/image-uploader";
import { TestDriveModal } from "@/components/test-drive-modal";
import { ChatDrawer } from "@/components/chat-drawer";
import { ReportListingModal } from "@/components/report-listing-modal";
import { ContactSellerModal } from "@/components/contact-seller-modal";
import { getImageUrl } from "@/lib/image-url";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";
import { ListingDetail } from "@/types/api";

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [car, setCar] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  // Modals & drawers state
  const [isTestDriveOpen, setIsTestDriveOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<ListingDetail>(`/listings/${id}`);
        setCar(data);
      } catch {
        setError("Car details could not be loaded or the listing is no longer available.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function toggleWishlist() {
    if (!car) return;
    try {
      if (isSaved) {
        await apiClient(`/wishlist/${car.id}`, { method: "DELETE" });
        setIsSaved(false);
      } else {
        await apiClient(`/wishlist/${car.id}`, { method: "PUT" });
        setIsSaved(true);
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="p-12 text-center text-slate-500">Loading car details…</main>
      </>
    );
  }

  if (error || !car) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-xl p-12 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Listing Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">{error || "This vehicle is unavailable."}</p>
          <Link href="/cars" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white">
            Back to Cars
          </Link>
        </main>
      </>
    );
  }

  const images = car.images && car.images.length > 0 ? car.images : [];
  const mainImageKey = images[selectedImgIdx]?.storage_key || null;
  const isOwnerOrAdmin = user && (user.id === car.owner_id || user.role === "admin");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/cars" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            ← Back to Marketplace
          </Link>
          <TrustBadge isVerified={car.is_verified} sellerType={car.seller_type} />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          {/* Left Column: Gallery & Specifications */}
          <div className="lg:col-span-8 space-y-8">
            {/* Main Photo Viewer */}
            <div className="overflow-hidden rounded-3xl border bg-slate-100 shadow-sm">
              <div className="relative aspect-[16/10] w-full bg-slate-900">
                {(() => {
                  const imgUrl = getImageUrl(mainImageKey);
                  return imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`${car.brand} ${car.model}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.querySelector(".no-img-placeholder")?.classList.remove("hidden");
                      }}
                      className="h-full w-full object-cover"
                    />
                  ) : null;
                })()}
                <div className={`no-img-placeholder absolute inset-0 flex flex-col items-center justify-center text-slate-500 ${getImageUrl(mainImageKey) ? "hidden" : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-semibold">No image available</span>
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3 bg-white border-t">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImgIdx(idx)}
                      className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                        selectedImgIdx === idx ? "border-slate-900 ring-2 ring-slate-900/20" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {(() => {
                        const thumbUrl = getImageUrl(img.storage_key);
                        return thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt="Car thumbnail"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.opacity = "0.3";
                            }}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-slate-200 text-slate-400 text-[8px] font-bold">No img</div>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Gallery & Owner/Admin Photo Manager Section */}
            {isOwnerOrAdmin ? (
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <ImageUploader
                  listingId={car.id}
                  images={car.images || []}
                  onImagesUpdated={(updatedImages) => {
                    setCar((prev) => (prev ? { ...prev, images: updatedImages } : prev));
                  }}
                />
              </div>
            ) : (
              images.length > 0 && (
                <div className="rounded-3xl border bg-white p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold text-slate-900 mb-4">Vehicle Photo Gallery ({images.length})</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImgIdx(idx)}
                        className={`cursor-pointer overflow-hidden rounded-2xl border aspect-video transition hover:opacity-90 ${
                          selectedImgIdx === idx ? "ring-2 ring-slate-900" : ""
                        }`}
                      >
                        {(() => {
                          const galleryUrl = getImageUrl(img.storage_key);
                          return galleryUrl ? (
                            <img
                              src={galleryUrl}
                              alt={`Photo ${idx + 1}`}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.opacity = "0.3";
                              }}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">No image</div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}


            {/* Vehicle Overview */}
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="font-display text-xl font-bold text-slate-900">Vehicle Overview</h3>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Year</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{car.manufacturing_year}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Kilometers</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{car.kilometers_driven.toLocaleString("en-IN")} km</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Fuel Type</p>
                  <p className="mt-1 text-lg font-bold capitalize text-slate-900">{car.fuel_type}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Transmission</p>
                  <p className="mt-1 text-lg font-bold capitalize text-slate-900">{car.transmission}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Body Type</p>
                  <p className="mt-1 text-lg font-bold capitalize text-slate-900">{car.body_type}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Owners</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{car.owner_count} Owner</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Location</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{car.city}, {car.state}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase">Seller Type</p>
                  <p className="mt-1 text-lg font-bold capitalize text-slate-900">{car.seller_type}</p>
                </div>
              </div>
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="font-display text-xl font-bold text-slate-900">Installed Features</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {car.features.map((feature, idx) => (
                    <span key={idx} className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="font-display text-xl font-bold text-slate-900">Seller Description</h3>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{car.description}</p>
            </div>
          </div>

          {/* Right Column: Pricing & Buyer Actions Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-6 rounded-3xl border bg-white p-6 shadow-lg space-y-6">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{car.brand}</span>
                <h1 className="text-2xl font-extrabold text-slate-900">{car.brand} {car.model}</h1>
                {car.variant && <p className="text-sm text-slate-500">{car.variant}</p>}
                
                <div className="mt-4 flex items-baseline justify-between border-t pt-4">
                  <span className="text-xs font-semibold text-slate-500">Asking Price</span>
                  <span className="text-3xl font-extrabold text-slate-900">₹{Number(car.price).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setIsTestDriveOpen(true)}
                  className="w-full rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg transition hover:bg-emerald-700"
                >
                  🚗 Request Test Drive
                </button>

                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full rounded-2xl bg-slate-900 py-3.5 font-bold text-white shadow-lg transition hover:bg-slate-800"
                >
                  💬 Chat with Dream Car Bazaar
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Send Message
                  </button>

                  <button
                    onClick={toggleWishlist}
                    className={`rounded-2xl border py-3 text-xs font-bold transition ${
                      isSaved ? "bg-red-50 text-red-600 border-red-200" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isSaved ? "♥ Saved" : "♡ Save Car"}
                  </button>
                </div>

                <div className="border-t pt-3 text-center">
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="text-xs font-medium text-slate-400 hover:text-red-600 hover:underline"
                  >
                    🚩 Report this listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <TestDriveModal
        listingId={car.id}
        carTitle={`${car.brand} ${car.model}`}
        isOpen={isTestDriveOpen}
        onClose={() => setIsTestDriveOpen(false)}
      />

      <ChatDrawer
        listingId={car.id}
        carTitle={`${car.brand} ${car.model}`}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <ReportListingModal
        listingId={car.id}
        carTitle={`${car.brand} ${car.model}`}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <ContactSellerModal
        listingId={car.id}
        carTitle={`${car.brand} ${car.model}`}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
}
