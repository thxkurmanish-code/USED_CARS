"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { apiClient } from "@/services/api-client";

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

export default function ContactPage() {
  const [contact, setContact] = useState<BusinessContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<BusinessContact>("/contact");
        setContact(data);
      } catch {
        // fallback defaults
        setContact({
          business_name: "Dream Car Bazaar",
          phone_number: "+91 98765 43210",
          whatsapp_number: "+91 98765 43210",
          email: "contact@dreamcarbazaar.com",
          address: "100 Prime Auto Plaza, Western Express Highway",
          city: "Mumbai",
          state: "Maharashtra",
          business_hours: "Mon - Sat: 9:30 AM - 7:30 PM",
        });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Official Showroom & Office</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Contact {contact?.business_name || "Dream Car Bazaar"}
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Have questions about a car, test drives, or selling your vehicle? Get in touch with our team directly.
          </p>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-slate-500">Loading contact details…</p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Quick Action Buttons */}
            <div className="rounded-3xl border bg-white p-8 shadow-sm space-y-6">
              <h2 className="font-display text-2xl font-bold text-slate-900">Direct Actions</h2>
              <div className="grid gap-4">
                <a
                  href={`tel:${contact?.phone_number}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Call Us</p>
                    <p className="text-lg font-bold text-slate-900">{contact?.phone_number}</p>
                  </div>
                  <span className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Call Now</span>
                </a>

                <a
                  href={`https://wa.me/${contact?.whatsapp_number?.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition hover:bg-emerald-100"
                >
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase">WhatsApp Chat</p>
                    <p className="text-lg font-bold text-emerald-900">{contact?.whatsapp_number}</p>
                  </div>
                  <span className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">WhatsApp</span>
                </a>

                <a
                  href={`mailto:${contact?.email}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Email Us</p>
                    <p className="text-base font-bold text-slate-900">{contact?.email}</p>
                  </div>
                  <span className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Send Email</span>
                </a>
              </div>
            </div>

            {/* Address & Showroom Details */}
            <div className="rounded-3xl border bg-white p-8 shadow-sm space-y-6">
              <h2 className="font-display text-2xl font-bold text-slate-900">Showroom Details</h2>

              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Showroom Address</p>
                  <p className="mt-1 font-medium text-slate-900">{contact?.address}</p>
                  <p className="text-slate-700">{contact?.city}, {contact?.state}</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Business Hours</p>
                  <p className="mt-1 font-medium text-slate-900">{contact?.business_hours}</p>
                </div>

                <div className="border-t pt-4">
                  <a
                    href={
                      contact?.google_maps_link && contact.google_maps_link.trim()
                        ? contact.google_maps_link
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${contact?.address ?? ""}, ${contact?.city ?? ""}, ${contact?.state ?? ""}`
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800"
                  >
                    📍 Get Showroom Directions
                  </a>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
