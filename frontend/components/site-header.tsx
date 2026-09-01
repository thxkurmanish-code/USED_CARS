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
        <Link href="/">
          <BrandMark />
        </Link>

        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
          <Link href="/cars" className="hover:text-slate-900">
            Browse Cars
          </Link>
          <Link href="/sell" className="hover:text-slate-900">
            Sell Your Car
          </Link>
          <Link href="/contact" className="hover:text-slate-900">
            Contact Us
          </Link>

          {!loading &&
            (user ? (
              <>
                {user.role === "admin" ? (
                  <>
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-slate-800"
                    >
                      🔒 Admin Console
                    </Link>
                    <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900">
                      My Customer Profile
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="hover:text-slate-900 font-bold">
                    My Dashboard
                  </Link>
                )}
                <button
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  onClick={() => void logout().then(() => router.push("/"))}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className="hover:text-slate-900">
                  Register
                </Link>
                <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
                  Sign In
                </Link>
              </>
            ))}
        </div>
      </nav>
    </header>
  );
}
