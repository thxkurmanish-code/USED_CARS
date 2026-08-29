import { BrandMark } from "@/components/brand-mark";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sand px-6 py-8 text-ink sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <BrandMark />
        <span className="text-sm font-medium text-slate-500">Marketplace foundation</span>
      </nav>
      <section className="mx-auto flex min-h-[72vh] max-w-6xl items-center">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-ember">Dream Car Bazaar</p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink sm:text-7xl">
            A trusted place for the car you have been looking for.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
            The marketplace experience is being carefully built for dealers and independent sellers alike.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link className="rounded-full bg-ink px-6 py-3 font-semibold text-white" href="/cars">Browse cars</Link>
            <Link className="rounded-full border border-slate-300 px-6 py-3 font-semibold" href="/sell">Sell your car</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
