import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-slate-100 p-4 text-4xl">🚗 404</div>
        <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-md">
          The page or vehicle listing you are looking for does not exist, may have been removed, or the link might be incorrect.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/cars"
            className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Browse All Cars
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go to Homepage
          </Link>
        </div>
      </main>
    </>
  );
}
