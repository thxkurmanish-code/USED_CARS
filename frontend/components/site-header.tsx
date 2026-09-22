"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { useAuth } from "@/features/auth/auth-provider";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full min-w-full border-b border-slate-200 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Top-Left Brand Logo - Perfect alignment with page container */}
        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="shrink-0">
          <BrandMark />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/cars" className="hover:text-slate-900 transition">
            Browse Cars
          </Link>
          <Link href="/sell" className="hover:text-slate-900 transition">
            Sell Your Car
          </Link>
          <Link href="/contact" className="hover:text-slate-900 transition">
            Contact Us
          </Link>

          {!loading &&
            (user ? (
              <div className="flex items-center gap-3">
                {user.role === "admin" ? (
                  <>
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
                    >
                      🔒 Admin Console
                    </Link>
                    <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-900 transition">
                      My Profile
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="hover:text-slate-900 font-bold transition">
                    My Dashboard
                  </Link>
                )}
                <button
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  onClick={() => void logout().then(() => router.push("/"))}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/register" className="hover:text-slate-900 transition">
                  Register
                </Link>
                <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow">
                  Sign In
                </Link>
              </div>
            ))}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Backdrop & Slide-Down Opaque Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay behind menu */}
          <div
            className="md:hidden fixed inset-0 top-[65px] z-40 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Opaque 100% Solid Mobile Dropdown Drawer */}
          <div className="md:hidden absolute top-full left-0 right-0 z-50 border-b border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2.5 text-sm font-semibold text-slate-800">
              <Link
                href="/cars"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 active:bg-slate-200 transition"
              >
                <span className="text-base">🚗</span> Browse Cars
              </Link>
              <Link
                href="/sell"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 active:bg-slate-200 transition"
              >
                <span className="text-base">➕</span> Sell Your Car
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 active:bg-slate-200 transition"
              >
                <span className="text-base">📞</span> Contact Us
              </Link>

              <div className="my-1 border-t border-slate-100 pt-3">
                {!loading &&
                  (user ? (
                    <div className="flex flex-col gap-2">
                      {user.role === "admin" ? (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 p-3 text-xs font-bold text-white shadow"
                          >
                            🔒 Admin Business Console
                          </Link>
                          <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="rounded-xl p-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            My Customer Profile
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="rounded-xl bg-slate-900 p-3 text-xs font-bold text-white text-center shadow"
                        >
                          My Dashboard
                        </Link>
                      )}
                      <button
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 text-center"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          void logout().then(() => router.push("/"));
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl border border-slate-300 p-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Register
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl bg-slate-900 p-2.5 text-center text-xs font-bold text-white hover:bg-slate-800 shadow"
                      >
                        Sign In
                      </Link>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
