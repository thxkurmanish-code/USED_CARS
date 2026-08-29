"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { useAuth } from "@/features/auth/auth-provider";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  return (
    <header className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur sm:px-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-5">
        <Link href="/"><BrandMark /></Link>
        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
          <Link href="/cars" className="hover:text-ember">Browse cars</Link>
          <Link href="/sell" className="hover:text-ember">Sell your car</Link>
          {!loading && (user ? <><Link href="/wishlist" className="hover:text-ember">Saved</Link><Link href="/enquiries" className="hover:text-ember">Enquiries</Link>{user.role === "admin" && <Link href="/admin" className="hover:text-ember">Admin</Link>}<Link href="/dashboard" className="hover:text-ember">Dashboard</Link><button className="rounded-full bg-ink px-4 py-2 text-white hover:bg-asphalt" onClick={() => void logout().then(() => router.push("/"))}>Logout</button></> : <><Link href="/register" className="hover:text-ember">Register</Link><Link href="/login" className="rounded-full bg-ink px-4 py-2 text-white hover:bg-asphalt">Sign in</Link></>)}
        </div>
      </nav>
    </header>
  );
}
