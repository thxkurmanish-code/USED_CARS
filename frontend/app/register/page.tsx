import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function RegisterPage() { return <><SiteHeader /><main className="mx-auto max-w-md px-6 py-16"><h1 className="font-display text-4xl font-bold">Create your account.</h1><p className="mt-4 text-slate-600">Registration is ready through the secure API. A complete guided signup screen is the next UI enhancement.</p><Link className="mt-8 inline-block rounded-lg bg-ink px-5 py-3 font-semibold text-white" href="/login">Go to sign in</Link></main></>; }
