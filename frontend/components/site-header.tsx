import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur sm:px-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-5">
        <Link href="/"><BrandMark /></Link>
        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
          <Link href="/cars" className="hover:text-ember">Browse cars</Link>
          <Link href="/sell" className="hover:text-ember">Sell your car</Link>
          <Link href="/login" className="rounded-full bg-ink px-4 py-2 text-white hover:bg-asphalt">Sign in</Link>
        </div>
      </nav>
    </header>
  );
}
