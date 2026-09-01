import React from "react";

interface TrustBadgeProps {
  isVerified?: boolean;
  sellerType?: string;
}

export function TrustBadge({ isVerified = false, sellerType = "individual" }: TrustBadgeProps) {
  if (isVerified || sellerType === "dealer") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Verified by Dream Car Bazaar
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
      Information provided by seller
    </div>
  );
}
