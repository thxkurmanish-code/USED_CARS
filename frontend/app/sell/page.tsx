import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function SellPage() { return <><SiteHeader /><main className="mx-auto max-w-3xl px-6 py-16"><p className="text-sm font-semibold uppercase tracking-[.2em] text-ember">Sell with confidence</p><h1 className="mt-3 font-display text-4xl font-bold">List your car with Dream Car Bazaar.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Create an account, add accurate vehicle details, and submit the listing for review. We never label a car as verified without a real verification.</p><Link className="mt-8 inline-block rounded-lg bg-ink px-5 py-3 font-semibold text-white" href="/register">Create an account</Link></main></>; }
