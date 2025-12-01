"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Solo mostrar footer en landing y pricing
  const showFooter = pathname === "/" || pathname === "/pricing";

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="border-t border-slate-800/50 bg-[#050816]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A5FFF]">
                <span className="text-sm font-bold text-white">FG</span>
              </div>
              <span className="text-lg font-semibold text-white">FaktuGo</span>
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
                <Link href="/#como-funciona" className="hover:text-white transition">
                  Cómo funciona
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
                <span className="text-slate-500">Privacidad (próximamente)</span>
              </li>
              <li>
                <span className="text-slate-500">Términos (próximamente)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FaktuGo. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-500">
            Hecho con ❤️ para autónomos y pymes
          </p>
        </div>
      </div>
    </footer>
  );
}
