import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-65px)] bg-sand px-4 py-8 text-ink sm:px-10 lg:px-16">
        <section className="mx-auto flex min-h-[72vh] max-w-6xl items-center">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-ember">Dream Car Bazaar</p>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink">
              A trusted place for the car you have been looking for.
            </h1>
            <p className="mt-5 sm:mt-7 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-slate-600">
              The marketplace experience is being carefully built for dealers and independent sellers alike.
            </p>
            <div className="mt-8 sm:mt-9 flex flex-wrap gap-4">
              <Link className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition" href="/cars">
                Browse cars
              </Link>
              <Link className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition" href="/sell">
                Sell your car
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
