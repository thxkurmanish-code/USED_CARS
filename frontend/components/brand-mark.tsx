export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 select-none group">
      <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900 shadow-md ring-1 ring-slate-800 transition-transform duration-200 group-hover:scale-105">
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6 text-ember transition-colors duration-200 group-hover:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM3 9l2-4h14l2 4M3 9h18v6a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1V9z"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-display text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
          Dream Car <span className="text-ember font-extrabold">Bazaar</span>
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">
          Verified Marketplace
        </span>
      </div>
    </div>
  );
}
