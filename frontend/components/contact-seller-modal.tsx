"use client";

import React, { FormEvent, useState } from "react";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";

interface ContactSellerModalProps {
  listingId: string;
  carTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSellerModal({ listingId, carTitle, isOpen, onClose }: ContactSellerModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("Hi, I am interested in your car. Is it still available for test drive?");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSending(true);
    setError(null);

    try {
      await apiClient(`/listings/${listingId}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setSuccess(true);
    } catch {
      setError("Unable to send inquiry. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-display text-xl font-bold">Contact Seller</h3>
            <p className="text-sm text-slate-500">{carTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {success ? (
          <div className="my-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
              ✓
            </div>
            <h4 className="mt-3 text-lg font-bold text-slate-900">Enquiry Sent!</h4>
            <p className="mt-1 text-sm text-slate-600">The seller has been notified and will respond shortly.</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!user ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                Please{" "}
                <a href="/login" className="font-bold underline">
                  sign in
                </a>{" "}
                to message the seller directly.
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Your Message
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>

                {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
