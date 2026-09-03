"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { TrustBadge } from "@/components/trust-badge";
import { ImageUploader } from "@/components/image-uploader";
import { getImageUrl } from "@/lib/image-url";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";
import {
  ListingDetail,
  TestDriveResponse,
  ConversationResponse,
  ChatMessage,
} from "@/types/api";

interface BusinessContact {
  business_name: string;
  phone_number: string;
  whatsapp_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  business_hours: string;
  google_maps_link?: string | null;
}

interface ReportResponse {
  id: string;
  listing_id: string;
  reason: string;
  details?: string | null;
  status: string;
  created_at: string;
  listing?: ListingDetail | null;
}

const fuelOptions = ["petrol", "diesel", "cng", "electric", "hybrid"];
const transmissionOptions = ["manual", "automatic", "amt", "cvt", "dct"];
const bodyTypeOptions = ["hatchback", "sedan", "suv", "muv", "coupe", "convertible", "pickup", "wagon", "other"];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"my_inventory" | "listings" | "test_drives" | "chat" | "contact" | "reports" | "analytics">("my_inventory");

  // Admin Data State
  const [myInventory, setMyInventory] = useState<ListingDetail[]>([]);
  const [pendingListings, setPendingListings] = useState<ListingDetail[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveResponse[]>([]);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [, setContact] = useState<BusinessContact | null>(null);

  const [loading, setLoading] = useState(true);
  const [expandedPhotoListingId, setExpandedPhotoListingId] = useState<string | null>(null);

  // Moderation state
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Test drive reschedule state
  const [reschedulingTdId, setReschedulingTdId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("02:00 PM");
  const [tdNote, setTdNote] = useState("");

  // Active chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState("");

  // Contact form state
  const [contactForm, setContactForm] = useState<BusinessContact | null>(null);
  const [contactMsg, setContactMsg] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);

  // Add Car Modal state
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [submittingCar, setSubmittingCar] = useState(false);

  // Form inputs for Admin adding new car
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [price, setPrice] = useState("");
  const [km, setKm] = useState("");
  const [fuelType, setFuelType] = useState("petrol");
  const [transmission, setTransmission] = useState("manual");
  const [bodyType, setBodyType] = useState("sedan");
  const [color, setColor] = useState("");
  const [ownerCount, setOwnerCount] = useState(1);
  const [city, setCity] = useState("Mumbai");
  const [stateName, setStateName] = useState("Maharashtra");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");

  async function loadAdminData() {
    setLoading(true);
    try {
      const [mineData, pendingData, tdData, convData, reportsData, contactData] = await Promise.all([
        apiClient<ListingDetail[]>("/listings/mine"),
        apiClient<ListingDetail[]>("/admin/listings/pending"),
        apiClient<TestDriveResponse[]>("/admin/test-drives"),
        apiClient<ConversationResponse[]>("/chat/conversations"),
        apiClient<ReportResponse[]>("/admin/reports"),
        apiClient<BusinessContact>("/contact"),
      ]);

      setMyInventory(mineData);
      setPendingListings(pendingData);
      setTestDrives(tdData);
      setConversations(convData);
      setReports(reportsData);
      setContact(contactData);
      setContactForm(contactData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && user.role === "admin") {
      void loadAdminData();
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  // Real-time polling for active chat tab in Admin Console
  useEffect(() => {
    if (activeTab !== "chat" || !user || user.role !== "admin") return;
    const interval = setInterval(async () => {
      try {
        const convs = await apiClient<ConversationResponse[]>("/chat/conversations");
        setConversations(convs);
      } catch {
        // ignore
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "chat" || !selectedConvId || !user || user.role !== "admin") return;
    const interval = setInterval(async () => {
      try {
        const msgs = await apiClient<ChatMessage[]>(`/chat/conversations/${selectedConvId}/messages`);
        setChatMessages((prev) => {
          const pending = prev.filter((m) => m.is_pending);
          const serverMsgIds = new Set(msgs.map((m) => m.id));
          const filteredPending = pending.filter((m) => !serverMsgIds.has(m.id));
          return [...msgs, ...filteredPending];
        });
      } catch {
        // ignore
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab, selectedConvId, user]);


  const [adminFiles, setAdminFiles] = useState<File[]>([]);
  const [addCarError, setAddCarError] = useState<string | null>(null);

  async function handleCreateShowroomCar(e: FormEvent) {
    e.preventDefault();
    setSubmittingCar(true);
    setAddCarError(null);
    try {
      const newCar = await apiClient<ListingDetail>("/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.trim(),
          model: model.trim(),
          variant: variant.trim() || undefined,
          manufacturing_year: Number(year) || 2022,
          registration_year: Number(year) || 2022,
          price: Number(price) || 100000,
          kilometers_driven: Number(km) || 0,
          fuel_type: fuelType,
          transmission,
          body_type: bodyType,
          color: color.trim() || undefined,
          owner_count: Number(ownerCount) || 1,
          city: city.trim() || "Mumbai",
          state: stateName.trim() || "Maharashtra",
          description: description.trim() || "Showroom vehicle in excellent condition.",
          features: features ? features.split(",").map((f) => f.trim()).filter(Boolean) : [],
          seller_type: "dealer",
        }),
      });

      if (adminFiles.length > 0) {
        for (const file of adminFiles) {
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



      await loadAdminData();
      setIsAddCarOpen(false);
      // Reset form
      setBrand("");
      setModel("");
      setVariant("");
      setPrice("");
      setKm("");
      setDescription("");
      setFeatures("");
      setAdminFiles([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add showroom car. Please review details.";
      setAddCarError(msg);
    } finally {

      setSubmittingCar(false);
    }
  }



  async function handleMarkSold(listingId: string) {
    try {
      await apiClient(`/listings/${listingId}/sold`, { method: "POST" });
      await loadAdminData();
    } catch {
      alert("Failed to mark car as sold.");
    }
  }

  async function handleDeleteListing(listingId: string) {
    if (!confirm("Are you sure you want to permanently delete this vehicle listing?")) return;
    try {
      await apiClient(`/listings/${listingId}`, { method: "DELETE" });
      await loadAdminData();
    } catch {
      alert("Failed to delete car listing.");
    }
  }


  async function handleApproveListing(listingId: string) {
    try {
      await apiClient(`/admin/listings/${listingId}/approve`, { method: "POST" });
      setPendingListings((prev) => prev.filter((item) => item.id !== listingId));
    } catch {
      alert("Failed to approve listing.");
    }
  }

  async function handleRejectListingSubmit(listingId: string) {
    if (rejectReason.trim().length < 5) {
      alert("Please provide a rejection reason (at least 5 characters).");
      return;
    }
    try {
      await apiClient(`/admin/listings/${listingId}/reject?reason=${encodeURIComponent(rejectReason.trim())}`, {
        method: "POST",
      });
      setPendingListings((prev) => prev.filter((item) => item.id !== listingId));
      setRejectingListingId(null);
      setRejectReason("");
    } catch {
      alert("Failed to reject listing.");
    }
  }

  async function handleUpdateTdStatus(tdId: string, status: string, notes?: string, resDate?: string, resTime?: string) {
    try {
      await apiClient(`/admin/test-drives/${tdId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_notes: notes || undefined,
          rescheduled_date: resDate || undefined,
          rescheduled_time: resTime || undefined,
        }),
      });
      setReschedulingTdId(null);
      await loadAdminData();
    } catch {
      alert("Failed to update test drive status.");
    }
  }

  async function openConversation(convId: string) {
    setSelectedConvId(convId);
    try {
      const msgs = await apiClient<ChatMessage[]>(`/chat/conversations/${convId}/messages`);
      setChatMessages(msgs);
      const updatedConvs = await apiClient<ConversationResponse[]>("/chat/conversations");
      setConversations(updatedConvs);
    } catch {
      // ignore
    }
  }

  async function handleDeleteConversation(convId: string) {
    if (!confirm("Are you sure you want to remove this chat conversation thread?")) return;
    try {
      await apiClient(`/chat/conversations/${convId}`, { method: "DELETE" });
      if (selectedConvId === convId) {
        setSelectedConvId(null);
        setChatMessages([]);
      }
      const updatedConvs = await apiClient<ConversationResponse[]>("/chat/conversations");
      setConversations(updatedConvs);
    } catch {
      alert("Failed to remove conversation.");
    }
  }

  async function sendAdminReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedConvId || !replyInput.trim() || !user) return;
    const text = replyInput.trim();
    setReplyInput("");

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      conversation_id: selectedConvId,
      sender_id: user.id,
      body: text,
      is_read: false,
      status: "sent",
      is_pending: true,
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, tempMsg]);

    try {
      const newMsg = await apiClient<ChatMessage>(`/chat/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      setChatMessages((prev) => prev.map((m) => (m.id === tempId ? { ...newMsg, status: "delivered" } : m)));
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Failed to send reply.");
    }
  }


  async function handleSaveContact(e: FormEvent) {
    e.preventDefault();
    if (!contactForm) return;
    setSavingContact(true);
    setContactMsg(null);
    try {
      const updated = await apiClient<BusinessContact>("/admin/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      setContact(updated);
      setContactMsg("Business contact information updated successfully!");
    } catch {
      setContactMsg("Failed to update contact info.");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleResolveReport(reportId: string) {
    try {
      await apiClient(`/admin/reports/${reportId}/resolve`, { method: "POST" });
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
    } catch {
      alert("Failed to resolve report.");
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <SiteHeader />
        <main className="p-10 text-center text-slate-500">Loading admin portal…</main>
      </>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-600">Admin privileges are required to access moderation tools.</p>
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
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white mb-2">
              🔒 Admin Business Portal
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Dream Car Bazaar Business Console</h1>
            <p className="mt-1 text-sm text-slate-500">Manage showroom inventory, customer test drives, live chat, and moderation.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/cars" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              Browse Marketplace
            </Link>
            <button
              onClick={() => setIsAddCarOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-700"
            >
              + Add Showroom Vehicle
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b pb-3">
          {[
            { id: "my_inventory", label: "Showroom Inventory", count: myInventory.length },
            { id: "listings", label: "Pending Moderation", count: pendingListings.length },
            { id: "test_drives", label: "Test Drives", count: testDrives.filter((t) => t.status === "pending").length },
            { id: "chat", label: "Customer Chat Threads", count: conversations.length },
            { id: "contact", label: "Business Contact Settings" },
            { id: "reports", label: "Listing Reports", count: reports.filter((r) => r.status === "open").length },
            { id: "analytics", label: "Analytics Overview" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "my_inventory" | "listings" | "test_drives" | "chat" | "contact" | "reports" | "analytics")}

              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* 1. SHOWROOM INVENTORY TAB (Admin Owned Cars) */}
        {activeTab === "my_inventory" && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">Dream Car Bazaar Showroom Inventory</h2>
                <p className="text-xs text-slate-500">Official vehicles listed under your business profile.</p>
              </div>
              <button
                onClick={() => setIsAddCarOpen(true)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-slate-800"
              >
                + Add New Vehicle
              </button>
            </div>

            {myInventory.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <p className="text-lg font-bold text-slate-700">No Showroom Vehicles Added Yet</p>
                <p className="mt-1 text-sm text-slate-500">Click below to add your first official used car listing.</p>
                <button
                  onClick={() => setIsAddCarOpen(true)}
                  className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  Add Showroom Vehicle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myInventory.map((car) => {
                  const coverImg = car.images && car.images.length > 0 ? car.images[0].storage_key : null;
                  return (
                    <div key={car.id} className="rounded-3xl border bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 border">
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
                          <div className={`no-img-placeholder absolute inset-0 flex items-center justify-center text-slate-400 text-[10px] font-semibold ${getImageUrl(coverImg) ? "hidden" : ""}`}>
                            No image
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                              {car.status}
                            </span>
                            <TrustBadge isVerified={car.is_verified} sellerType={car.seller_type} />
                          </div>
                          <h3 className="mt-1 text-lg font-bold text-slate-900">
                            {car.manufacturing_year} {car.brand} {car.model}
                          </h3>
                          <p className="text-xs text-slate-500">
                            ₹{Number(car.price).toLocaleString("en-IN")} · {car.kilometers_driven.toLocaleString("en-IN")} km · {car.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setExpandedPhotoListingId(expandedPhotoListingId === car.id ? null : car.id)}
                          className="rounded-xl border px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          📷 Manage Photos ({car.images?.length || 0})
                        </button>

                        {car.status === "active" && (
                          <button
                            onClick={() => handleMarkSold(car.id)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            Mark as Sold
                          </button>
                        )}

                        <Link href={`/cars/${car.id}`} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
                          View Live →
                        </Link>

                        <button
                          onClick={() => void handleDeleteListing(car.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          🗑 Remove
                        </button>

                      </div>


                      {expandedPhotoListingId === car.id && (
                        <div className="w-full border-t pt-4">
                          <ImageUploader
                            listingId={car.id}
                            images={car.images || []}
                            onImagesUpdated={(updatedImages) => {
                              setMyInventory((prev) =>
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

        {/* 2. PENDING MODERATION TAB (Customer Listings) */}
        {activeTab === "listings" && (
          <div className="mt-8">
            {pendingListings.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
                  ✓
                </div>
                <p className="mt-3 text-lg font-bold text-slate-900">Queue is Clear!</p>
                <p className="mt-1 text-sm text-slate-500">All submitted customer car listings have been moderated.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingListings.map((car) => {
                  const coverImg = car.images && car.images.length > 0 ? car.images[0].storage_key : null;
                  return (
                    <div key={car.id} className="overflow-hidden rounded-3xl border bg-white shadow-sm grid lg:grid-cols-12">
                      <div className="relative aspect-[16/10] bg-slate-100 lg:col-span-4">
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
                      </div>

                      <div className="flex flex-col justify-between p-6 lg:col-span-8">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              {car.brand} · {car.manufacturing_year}
                            </span>
                            <TrustBadge isVerified={car.is_verified} sellerType={car.seller_type} />
                          </div>

                          <h3 className="mt-1 text-2xl font-bold text-slate-900">
                            {car.brand} {car.model} {car.variant && <span className="text-base font-normal text-slate-500">({car.variant})</span>}
                          </h3>

                          <p className="mt-2 text-xl font-extrabold text-slate-900">
                            ₹{Number(car.price).toLocaleString("en-IN")}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                            <span className="rounded-lg bg-slate-100 px-3 py-1">{car.kilometers_driven.toLocaleString("en-IN")} km</span>
                            <span className="rounded-lg bg-slate-100 px-3 py-1 capitalize">{car.fuel_type}</span>
                            <span className="rounded-lg bg-slate-100 px-3 py-1 capitalize">{car.transmission}</span>
                            <span className="rounded-lg bg-slate-100 px-3 py-1">{car.city}, {car.state}</span>
                            <span className="rounded-lg bg-slate-100 px-3 py-1">{car.owner_count} Owner</span>
                          </div>

                          <p className="mt-4 text-xs leading-relaxed text-slate-600 line-clamp-3">{car.description}</p>
                        </div>

                        {rejectingListingId === car.id ? (
                          <div className="mt-6 rounded-2xl bg-red-50 p-4 space-y-3">
                            <label className="block text-xs font-bold text-red-900">
                              Rejection Reason Feedback:
                              <textarea
                                rows={2}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Please upload clear photos of interior and engine bay."
                                className="mt-1.5 w-full rounded-xl border border-red-200 p-2.5 text-xs text-slate-900 focus:outline-none"
                              />
                            </label>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setRejectingListingId(null)}
                                className="rounded-xl border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleRejectListingSubmit(car.id)}
                                className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                Confirm Rejection
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
                            <button
                              onClick={() => void handleDeleteListing(car.id)}
                              className="rounded-xl border border-red-300 bg-red-100 px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-200"
                            >
                              🗑 Delete
                            </button>
                            <button
                              onClick={() => setRejectingListingId(car.id)}
                              className="rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveListing(car.id)}
                              className="rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                            >
                              ✓ Approve Listing
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. TEST DRIVES TAB */}
        {activeTab === "test_drives" && (
          <div className="mt-8">
            {testDrives.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <p className="text-lg font-bold text-slate-700">No Test Drive Appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testDrives.map((td) => (
                  <div key={td.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-800">
                          {td.status}
                        </span>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">
                          {td.listing ? `${td.listing.manufacturing_year} ${td.listing.brand} ${td.listing.model}` : "Car Test Drive"}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          Customer Requested Date: <strong>{td.preferred_date}</strong> at <strong>{td.preferred_time}</strong>
                        </p>
                        <p className="text-xs text-slate-600">Contact Phone: <strong>{td.contact_phone}</strong></p>
                        {td.message && <p className="mt-2 text-xs text-slate-500 italic">&quot;{td.message}&quot;</p>}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {td.status !== "approved" && (
                          <button
                            onClick={() => handleUpdateTdStatus(td.id, "approved", "Confirmed. See you at showroom.")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                          >
                            ✓ Approve Appointment
                          </button>
                        )}
                        <button
                          onClick={() => setReschedulingTdId(td.id)}
                          className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm"
                        >
                          Reschedule
                        </button>
                        {td.status !== "rejected" && (
                          <button
                            onClick={() => handleUpdateTdStatus(td.id, "rejected", "Slot unavailable.")}
                            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>

                    {reschedulingTdId === td.id && (
                      <div className="mt-4 border-t pt-4 space-y-3">
                        <p className="text-xs font-bold text-purple-900">Reschedule Appointment</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="rounded-xl border p-2 text-xs"
                          />
                          <input
                            type="text"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            placeholder="e.g. 03:00 PM"
                            className="rounded-xl border p-2 text-xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={tdNote}
                          onChange={(e) => setTdNote(e.target.value)}
                          placeholder="Note to customer..."
                          className="w-full rounded-xl border p-2 text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setReschedulingTdId(null)} className="rounded-xl border px-3 py-1 text-xs">
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateTdStatus(td.id, "rescheduled", tdNote, rescheduleDate, rescheduleTime)}
                            className="rounded-xl bg-purple-600 px-4 py-1 text-xs font-bold text-white"
                          >
                            Save Reschedule
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CUSTOMER CHAT TAB */}
        {activeTab === "chat" && (
          <div className="mt-8 grid gap-6 md:grid-cols-12">
            <div className="md:col-span-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-700 uppercase">Conversations ({conversations.length})</h3>
              {conversations.map((conv) => {
                const unread = conv.unread_count || 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => void openConversation(conv.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition flex items-center justify-between ${
                      selectedConvId === conv.id ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-sm truncate">
                        {conv.listing ? `${conv.listing.brand} ${conv.listing.model}` : "Car Inquiry"}
                      </p>
                      {conv.last_message && (
                        <p className={`mt-1 text-xs truncate ${selectedConvId === conv.id ? "text-slate-300" : "text-slate-500"}`}>
                          {conv.last_message.body}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                          {unread}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteConversation(conv.id);
                        }}
                        className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                          selectedConvId === conv.id
                            ? "bg-red-500/20 text-red-300 hover:bg-red-500/40"
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                        title="Remove Conversation"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:col-span-7 rounded-3xl border bg-white p-6 shadow-sm flex flex-col h-[560px]">
              {!selectedConvId ? (
                <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                  Select a conversation thread to respond to customer questions.
                </div>
              ) : (
                <>
                  {(() => {
                    const selectedConv = conversations.find((c) => c.id === selectedConvId);
                    return (
                      <>
                        {selectedConv && (
                          <div className="mb-3 rounded-2xl border bg-slate-900 p-4 text-white shadow-md">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Customer Identity</p>
                                <h4 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                                  👤 {selectedConv.customer?.display_name || "Customer"}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedConv.listing && (
                                  <span className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
                                    🚗 {selectedConv.listing.manufacturing_year} {selectedConv.listing.brand} {selectedConv.listing.model}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteConversation(selectedConv.id)}
                                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
                                  title="Remove Conversation"
                                >
                                  🗑 Remove Thread
                                </button>
                              </div>
                            </div>

                            <div className="mt-2.5 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                              <div>
                                <span className="text-[9px] font-semibold uppercase text-slate-400 block">Email Address</span>
                                <a href={`mailto:${selectedConv.customer?.email}`} className="font-semibold text-white hover:underline flex items-center gap-1">
                                  📧 {selectedConv.customer?.email || "Not specified"}
                                </a>
                              </div>
                              <div>
                                <span className="text-[9px] font-semibold uppercase text-slate-400 block">Phone Number</span>
                                <a href={`tel:${selectedConv.customer?.phone_number}`} className="font-semibold text-white hover:underline flex items-center gap-1">
                                  📱 {selectedConv.customer?.phone_number || "Not specified"}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl">

                    {chatMessages.map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      const isRead = msg.is_read || msg.status === "read";
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl p-3 text-xs ${isMe ? "bg-slate-900 text-white" : "bg-white border text-slate-900"}`}>
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-80">
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {isMe && (
                                <span className="font-bold">
                                  {msg.is_pending ? (
                                    <span title="Sending (✓)">✓</span>
                                  ) : isRead ? (
                                    <span className="text-emerald-400 font-bold" title="Read (✓✓)">
                                      ✓✓
                                    </span>
                                  ) : (
                                    <span className="text-slate-300" title="Delivered (✓✓)">
                                      ✓✓
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>


                  <form onSubmit={sendAdminReply} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder="Type admin response..."
                      className="flex-1 rounded-xl border p-2.5 text-xs focus:outline-none"
                    />
                    <button type="submit" className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white">
                      Reply
                    </button>
                  </form>
                </>
              );
            })()}
          </>
        )}
      </div>

          </div>
        )}

        {/* 5. BUSINESS CONTACT SETTINGS TAB */}
        {activeTab === "contact" && contactForm && (
          <div className="mt-8 max-w-2xl">
            <form onSubmit={handleSaveContact} className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900">Manage Business Contact Information</h2>
              <p className="text-xs text-slate-500">Configure public contact details displayed across the website and contact page.</p>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Business Name *
                <input
                  type="text"
                  required
                  value={contactForm.business_name}
                  onChange={(e) => setContactForm({ ...contactForm, business_name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Phone Number *
                  <input
                    type="text"
                    required
                    value={contactForm.phone_number}
                    onChange={(e) => setContactForm({ ...contactForm, phone_number: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  WhatsApp Number *
                  <input
                    type="text"
                    required
                    value={contactForm.whatsapp_number}
                    onChange={(e) => setContactForm({ ...contactForm, whatsapp_number: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Public Email *
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                />
              </label>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Address *
                <input
                  type="text"
                  required
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  City *
                  <input
                    type="text"
                    required
                    value={contactForm.city}
                    onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  State *
                  <input
                    type="text"
                    required
                    value={contactForm.state}
                    onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Business Hours *
                <input
                  type="text"
                  required
                  value={contactForm.business_hours}
                  onChange={(e) => setContactForm({ ...contactForm, business_hours: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border p-3 text-sm"
                />
              </label>

              {contactMsg && <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{contactMsg}</p>}

              <button
                type="submit"
                disabled={savingContact}
                className="rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50"
              >
                {savingContact ? "Saving..." : "Save Contact Info"}
              </button>
            </form>
          </div>
        )}

        {/* 6. LISTING REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="mt-8">
            {reports.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center bg-white">
                <p className="text-lg font-bold text-slate-700">No Listing Reports</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div key={rep.id} className="rounded-3xl border bg-white p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${rep.status === "open" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>
                        {rep.status}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-2">Reason: {rep.reason}</h4>
                      {rep.details && <p className="text-xs text-slate-500 mt-1">{rep.details}</p>}
                    </div>

                    {rep.status === "open" && (
                      <button
                        onClick={() => handleResolveReport(rep.id)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Showroom Inventory</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-slate-900">{myInventory.length}</p>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Moderation</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-slate-900">{pendingListings.length}</p>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Test Drive Requests</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-slate-900">{testDrives.length}</p>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Customer Chat Threads</p>
              <p className="mt-2 font-display text-4xl font-extrabold text-slate-900">{conversations.length}</p>
            </div>
          </div>
        )}
      </main>

      {/* Admin Add Showroom Car Modal */}
      {isAddCarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">Add Showroom Vehicle</h3>
                <p className="text-xs text-slate-500">Listed directly under Dream Car Bazaar (Verified Status)</p>
              </div>
              <button onClick={() => setIsAddCarOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShowroomCar} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Brand *
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. BMW, Honda"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Model *
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. 3 Series, City"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Variant
                  <input
                    type="text"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="e.g. 330i M Sport"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Year *
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Price (₹) *
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 2500000"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  KM Driven *
                  <input
                    type="number"
                    required
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    placeholder="e.g. 15000"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Fuel Type *
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm capitalize"
                  >
                    {fuelOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Transmission *
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm capitalize"
                  >
                    {transmissionOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Body Type *
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm capitalize"
                  >
                    {bodyTypeOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Color
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Alpine White"
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Owner Count *
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={ownerCount}
                    onChange={(e) => setOwnerCount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  City *
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase text-slate-700">
                  State *
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Description *
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of vehicle condition, service history, and warranties..."
                  className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                />
              </label>

              <label className="block text-xs font-semibold uppercase text-slate-700">
                Main Vehicle Cover Photo (Select 1 Image)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setAdminFiles(Array.from(e.target.files))}
                  className="mt-1 w-full rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-600 bg-slate-50 cursor-pointer hover:bg-slate-100"
                />
                {adminFiles.length > 0 && (
                  <p className="mt-1 text-xs font-bold text-emerald-600">
                    ✓ Cover photo selected ({adminFiles[0]?.name}). Additional photos can be added on the car page anytime!
                  </p>
                )}
              </label>


              <label className="block text-xs font-semibold uppercase text-slate-700">
                Installed Features (comma separated)
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Sunroof, Leather Seats, Navigation, Rear Camera"
                  className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                />
              </label>


              {addCarError && (
                <p className="rounded-xl bg-red-50 p-3.5 text-xs text-red-700 font-medium border border-red-200">
                  {addCarError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={() => setIsAddCarOpen(false)}
                  className="rounded-xl border px-4 py-2.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCar}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submittingCar ? "Adding Vehicle..." : "Add Showroom Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
