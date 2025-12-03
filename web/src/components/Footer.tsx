"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CookieSettingsButton } from "./CookieBanner";

export default function Footer() {
  const pathname = usePathname();

  // Solo mostrar footer en landing, pricing y páginas legales
  const showFooter = 
    pathname === "/" || 
    pathname === "/pricing" || 
    pathname?.startsWith("/legal");

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="border-t border-slate-800/50 bg-[#050816]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <Link href="/" className="inline-flex items-center">
                <img
                  src="/logo-faktugo.svg"
                  alt="FaktuGo"
                  className="h-16 w-auto sm:h-20 md:h-24"
                />
              </Link>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              La forma más inteligente, automática y segura de gestionar tus facturas. 
              Escanea, clasifica y envía a tu gestoría sin esfuerzo.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Producto</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/como-funciona" className="hover:text-white transition">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/guia" className="hover:text-white transition">
                  Guías
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Planes y precios
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Acceder
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/legal/aviso-legal" className="hover:text-white transition">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="hover:text-white transition">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="hover:text-white transition">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-white transition">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FaktuGo. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/legal/aviso-legal" className="hover:text-slate-300">Aviso Legal</Link>
            <Link href="/legal/terminos" className="hover:text-slate-300">Términos</Link>
            <Link href="/legal/privacidad" className="hover:text-slate-300">Privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-slate-300">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
