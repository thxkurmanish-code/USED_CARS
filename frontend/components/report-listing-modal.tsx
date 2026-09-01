"use client";

import React, { FormEvent, useState } from "react";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";

interface ReportListingModalProps {
  listingId: string;
  carTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Fake or fraudulent listing",
  "Incorrect price or specification details",
  "Suspicious seller activity",
  "Duplicate listing",
  "Inappropriate content or photos",
  "Vehicle already sold elsewhere",
];

export function ReportListingModal({ listingId, carTitle, isOpen, onClose }: ReportListingModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      await apiClient(`/listings/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details || undefined }),
      });
      setSuccess(true);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">Report Listing</h3>
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
            <h4 className="mt-3 text-lg font-bold text-slate-900">Report Submitted</h4>
            <p className="mt-1 text-sm text-slate-600">Thank you. Our moderation team will investigate this listing.</p>
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
                to submit a listing report.
              </div>
            ) : (
              <>
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Primary Reason *
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Additional Details
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide any additional context or evidence..."
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
                    disabled={submitting}
                    className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Report"}
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
