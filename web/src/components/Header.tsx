"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

const appNavItems = [
  { href: "/", label: "Inicio"},
  { href: "/dashboard", label: "Dashboard"},
  { href: "/invoices", label: "Facturas"},
  { href: "/invoices/upload", label: "Subir"},
];

const landingNavItems = [
  { href: "/", label: "Inicio" },
  { href: "/pricing", label: "Planes" },
  { href: "/como-funciona", label: "Cómo funciona" },
];

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    window.location.href = "/login";
  };

  // No mostrar header en login o auth
  if (pathname === "/login" || pathname?.startsWith("/auth")) {
    return null;
  }

  const isLanding =
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/como-funciona" ||
    pathname === "/app";

  // Landing/Public Header
  if (isLanding) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#050816]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-faktugo.svg"
              alt="FaktuGo"
              className="h-10 w-auto sm:h-12 md:h-14"
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {landingNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-[#22CC88] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[#18a96f] transition"
              >
                Panel
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-[#2A5FFF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#224bcc] transition"
              >
                Acceder
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  const navItems = appNavItems;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#050816]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo-faktugo.svg"
            alt="FaktuGo"
            className="h-9 w-auto sm:h-11 md:h-12"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden text-right text-xs text-slate-400 md:block">
              <span>{user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:bg-white/5 md:block"
          >
            Cerrar sesión
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-slate-800 bg-[#050816] px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {user && (
            <div className="mt-3 border-t border-slate-800 pt-3">
              <p className="mb-2 text-xs text-slate-500">{user.email}</p>
              <button
                onClick={handleLogout}
                className="w-full rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-300"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
