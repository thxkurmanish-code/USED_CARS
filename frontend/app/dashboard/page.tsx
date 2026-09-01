"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ImageUploader } from "@/components/image-uploader";
import { TrustBadge } from "@/components/trust-badge";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";
import { ListingDetail, ListingSummary, TestDriveResponse, ConversationResponse } from "@/types/api";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<"cars" | "test_drives" | "messages" | "wishlist" | "settings">("cars");

  // State data
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveResponse[]>([]);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [wishlist, setWishlist] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [expandedPhotoListingId, setExpandedPhotoListingId] = useState<string | null>(null);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [listingsData, testDrivesData, convsData, wishlistData] = await Promise.all([
        apiClient<ListingDetail[]>("/listings/mine"),
        apiClient<TestDriveResponse[]>("/test-drives/mine"),
        apiClient<ConversationResponse[]>("/chat/conversations"),
        apiClient<ListingSummary[]>("/wishlist"),
      ]);

      setListings(listingsData);
      setTestDrives(testDrivesData);
      setConversations(convsData);
      setWishlist(wishlistData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      void loadDashboardData();
    }
  }, [user]);

  async function handleSubmitForReview(listingId: string) {
    try {
      await apiClient(`/listings/${listingId}/submit`, { method: "POST" });
      await loadDashboardData();
    } catch {
      alert("Failed to submit listing for review.");
    }
  }

  async function handleMarkSold(listingId: string) {
    try {
      await apiClient(`/listings/${listingId}/sold`, { method: "POST" });
      await loadDashboardData();
    } catch {
      alert("Failed to mark listing as sold.");
    }
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await apiClient("/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          phone_number: phone || undefined,
          city: city || undefined,
          state: state || undefined,
        }),
      });
      setProfileMsg("Profile updated successfully!");
    } catch {
      setProfileMsg("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteListing(listingId: string) {
    if (!confirm("Are you sure you want to delete this car listing?")) return;
    try {
      await apiClient(`/listings/${listingId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch {
      alert("Failed to delete listing.");
    }
  }


  if (authLoading || loading) {
    return (
      <>
        <SiteHeader />
        <main className="p-10 text-center text-slate-500">Loading customer dashboard…</main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Customer Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Please sign in to view your cars, test drives, and messages.</p>
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Customer Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back! Manage your car listings, test drive appointments, and chat.</p>
          </div>
          <Link href="/sell" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white shadow hover:bg-slate-800">
            + List New Car
          </Link>
        </div>

        {/* Main Section Navigation */}
        <div className="mt-6 flex flex-wrap gap-3 border-b pb-4">
          {[
            { id: "cars", label: "My Cars", count: listings.length },
            { id: "test_drives", label: "Test Drives", count: testDrives.length },
            { id: "messages", label: "Messages & Chat", count: conversations.length },
            { id: "wishlist", label: "Wishlist", count: wishlist.length },
            { id: "settings", label: "Account Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as "cars" | "test_drives" | "messages" | "wishlist" | "settings")}

              className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                activeMainTab === tab.id
                  ? "bg-slate-900 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* 1. MY CARS TAB */}
        {activeMainTab === "cars" && (
          <div className="mt-8">
            {listings.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <p className="text-lg font-bold text-slate-700">No cars listed yet</p>
                <p className="mt-1 text-sm text-slate-500">List your used vehicle to reach verified buyers across the marketplace.</p>
                <Link href="/sell" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white">
                  Add Your Car
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((car) => {
                  const statusColors: Record<string, string> = {
                    draft: "bg-slate-100 text-slate-700",
                    pending_review: "bg-amber-100 text-amber-800",
                    active: "bg-emerald-100 text-emerald-800",
                    rejected: "bg-red-100 text-red-800",
                    sold: "bg-blue-100 text-blue-800",
                  };

                  return (
                    <div key={car.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusColors[car.status] || "bg-slate-100"}`}>
                              {car.status.replaceAll("_", " ")}
                            </span>
                            <TrustBadge isVerified={car.is_verified} sellerType={car.seller_type} />
                          </div>

                          <h3 className="mt-2 text-xl font-bold text-slate-900">
                            {car.manufacturing_year} {car.brand} {car.model}
                          </h3>
                          <p className="text-sm text-slate-500">
                            ₹{Number(car.price).toLocaleString("en-IN")} · {car.kilometers_driven.toLocaleString("en-IN")} km · {car.city}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setExpandedPhotoListingId(expandedPhotoListingId === car.id ? null : car.id)}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            📷 Photos ({car.images?.length || 0})
                          </button>

                          {car.status === "draft" && (
                            <button
                              onClick={() => handleSubmitForReview(car.id)}
                              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Submit for Review
                            </button>
                          )}

                          {car.status === "active" && (
                            <button
                              onClick={() => handleMarkSold(car.id)}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Mark as Sold
                            </button>
                          )}

                          <Link
                            href={`/cars/${car.id}`}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            View Details
                          </Link>

                          <button
                            onClick={() => void handleDeleteListing(car.id)}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            🗑 Remove
                          </button>

                        </div>

                      </div>

                      {car.rejection_reason && (
                        <div className="mt-4 rounded-xl bg-red-50 p-4 text-xs text-red-900">
                          <strong>Rejection Note:</strong> {car.rejection_reason}
                        </div>
                      )}

                      {/* Photo Uploader Drawer */}
                      {expandedPhotoListingId === car.id && (
                        <div className="mt-6 border-t pt-5">
                          <ImageUploader
                            listingId={car.id}
                            images={car.images || []}
                            onImagesUpdated={(updatedImages) => {
                              setListings((prev) =>
                                prev.map((item) => (item.id === car.id ? { ...item, images: updatedImages } : item))
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. TEST DRIVES TAB */}
        {activeMainTab === "test_drives" && (
          <div className="mt-8">
            {testDrives.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <p className="text-lg font-bold text-slate-700">No Test Drive Appointments</p>
                <p className="mt-1 text-sm text-slate-500">When you request a test drive for a vehicle, appointment status updates appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testDrives.map((td) => {
                  const tdStatusColors: Record<string, string> = {
                    pending: "bg-amber-100 text-amber-800",
                    approved: "bg-emerald-100 text-emerald-800",
                    rejected: "bg-red-100 text-red-800",
                    rescheduled: "bg-purple-100 text-purple-800",
                    completed: "bg-blue-100 text-blue-800",
                    cancelled: "bg-slate-100 text-slate-700",
                  };

                  return (
                    <div key={td.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${tdStatusColors[td.status] || "bg-slate-100"}`}>
                            {td.status}
                          </span>
                          <h3 className="mt-2 text-lg font-bold text-slate-900">
                            {td.listing ? `${td.listing.manufacturing_year} ${td.listing.brand} ${td.listing.model}` : "Car Test Drive"}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Requested Date: <strong>{td.preferred_date}</strong> at <strong>{td.preferred_time}</strong>
                          </p>
                          {td.contact_phone && <p className="text-xs text-slate-500">Contact Phone: {td.contact_phone}</p>}
                        </div>

                        {td.listing && (
                          <Link href={`/cars/${td.listing_id}`} className="rounded-xl border px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            View Vehicle →
                          </Link>
                        )}
                      </div>

                      {td.admin_notes && (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-800 border">
                          <strong>Admin Message:</strong> {td.admin_notes}
                        </div>
                      )}

                      {td.rescheduled_date && (
                        <div className="mt-2 rounded-2xl bg-purple-50 p-3 text-xs text-purple-900">
                          <strong>Rescheduled Schedule:</strong> {td.rescheduled_date} at {td.rescheduled_time}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. MESSAGES TAB */}
        {activeMainTab === "messages" && (
          <div className="mt-8">
            {conversations.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <p className="text-lg font-bold text-slate-700">No Chat Conversations</p>
                <p className="mt-1 text-sm text-slate-500">Chat messages sent regarding vehicles will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conv) => (
                  <div key={conv.id} className="rounded-3xl border bg-white p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {conv.listing ? `${conv.listing.brand} ${conv.listing.model}` : "Car Inquiry"}
                      </h3>
                      {conv.last_message && (
                        <p className="mt-1 text-xs text-slate-600 truncate max-w-lg">
                          Last Message: &quot;{conv.last_message.body}&quot;

                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">
                        Updated: {new Date(conv.updated_at).toLocaleString()}
                      </p>
                    </div>

                    {conv.listing_id && (
                      <Link href={`/cars/${conv.listing_id}`} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
                        Open Car Chat →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. WISHLIST TAB */}
        {activeMainTab === "wishlist" && (
          <div className="mt-8">
            {wishlist.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <p className="text-lg font-bold text-slate-700">No Saved Cars</p>
                <p className="mt-1 text-sm text-slate-500">Bookmark cars while browsing to compare them here.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {wishlist.map((car) => (
                  <div key={car.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900">{car.brand} {car.model}</h3>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">₹{Number(car.price).toLocaleString("en-IN")}</p>
                    <Link href={`/cars/${car.id}`} className="mt-4 block text-xs font-bold text-slate-900 hover:underline">
                      View Car Details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. ACCOUNT SETTINGS TAB */}
        {activeMainTab === "settings" && (
          <div className="mt-8 max-w-xl">
            <form onSubmit={handleProfileSubmit} className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900">Edit Profile & Settings</h2>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Display Name *
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={user.email.split("@")[0]}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Phone Number
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  City
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  State
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>
              </div>

              {profileMsg && <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{profileMsg}</p>}

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Profile Changes"}
              </button>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
