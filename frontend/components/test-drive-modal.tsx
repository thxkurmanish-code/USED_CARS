"use client";

import React, { FormEvent, useState } from "react";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";

interface TestDriveModalProps {
  listingId: string;
  carTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TestDriveModal({ listingId, carTitle, isOpen, onClose }: TestDriveModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("11:00 AM");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
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
      await apiClient("/test-drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          preferred_date: date,
          preferred_time: time,
          contact_phone: phone,
          message: message || undefined,
        }),
      });
      setSuccess(true);
    } catch {
      setError("Unable to submit test drive request. Please check details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">Request Test Drive</h3>
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
            <h4 className="mt-3 text-lg font-bold text-slate-900">Test Drive Requested!</h4>
            <p className="mt-1 text-sm text-slate-600">
              Our team will review your appointment request and confirm your test drive schedule.
            </p>
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
                to request a test drive appointment.
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Preferred Date *
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </label>

                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Preferred Time *
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="05:30 PM">05:30 PM</option>
                    </select>
                  </label>
                </div>

                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Contact Phone Number *
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Optional Note / Request
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any specific questions or preferred location details..."
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
                    className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Confirm Appointment"}
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
