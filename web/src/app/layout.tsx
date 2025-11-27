import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FaktuGo — Tus facturas, en piloto automático",
  description:
    "FaktuGo es la app Local-First para escanear, clasificar y organizar facturas automáticamente desde el móvil y el navegador, con sincronización y envíos a gestoría opcionales.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user: any = null;
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {}

  const isLoggedIn = !!user;
  const displayName = user?.user_metadata?.full_name || user?.email || "";

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
          <header className="border-b border-slate-800/70 bg-[#050816]/95">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2A5FFF] text-xs font-bold text-white">
                  FG
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight">FaktuGo</span>
                  <span className="text-xs text-slate-400">Facturas en piloto automatico</span>
                </div>
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-slate-200">
                <Link
                  href="/"
                  className="rounded-full px-3 py-1 text-slate-200 hover:bg-white/10"
                >
                  Inicio
                </Link>
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="rounded-full px-3 py-1 text-slate-200 hover:bg-white/10"
                  >
                    Panel
                  </Link>
                ) : null}
                <Link
                  href="/pricing"
                  className="rounded-full px-3 py-1 text-slate-200 hover:bg-white/10"
                >
                  Planes
                </Link>
                {isLoggedIn ? (
                  <form
                    action="/auth/logout"
                    method="post"
                    className="flex items-center gap-2"
                  >
                    <span className="hidden text-xs text-slate-300 sm:inline">
                      {displayName}
                    </span>
                    <button
                      type="submit"
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-50 hover:bg-white/10"
                    >
                      Salir
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-white/5 px-3 py-1 text-slate-50 hover:bg-white/10"
                  >
                    Acceder
                  </Link>
                )}
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
