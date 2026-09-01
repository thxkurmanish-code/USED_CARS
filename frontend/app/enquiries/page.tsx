"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/features/auth/auth-provider";
import { apiClient } from "@/services/api-client";
import { Enquiry } from "@/types/api";

export default function EnquiriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<Enquiry[]>("/enquiries");
        setEnquiries(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      void load();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <>
        <SiteHeader />
        <main className="p-10 text-center text-slate-500">Loading messages…</main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-md p-10 text-center">
          <h1 className="text-3xl font-bold">Your Messages</h1>
          <p className="mt-2 text-sm text-slate-600">Please sign in to view buyer and seller messages.</p>
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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Enquiries & Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Track buyer questions and test drive requests for listed vehicles.</p>

        {enquiries.length === 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed p-12 text-center bg-white">
            <p className="text-lg font-bold text-slate-700">No Messages Yet</p>
            <p className="mt-1 text-sm text-slate-500">When buyers contact you or when you send inquiries, they will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {enquiries.map((enq) => {
              const isSeller = enq.seller_id === user.id;
              return (
                <div key={enq.id} className="rounded-3xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-3 text-xs font-semibold text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800 uppercase">
                      {isSeller ? "Received Inquiry" : "Sent Inquiry"}
                    </span>
                    <span>{new Date(enq.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-900">{enq.message}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 text-xs text-slate-500">
                    <span>Listing ID: {enq.listing_id}</span>
                    <Link href={`/cars/${enq.listing_id}`} className="font-semibold text-slate-900 hover:underline">
                      View Car Listing →
                    </Link>
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
