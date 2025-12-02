import Link from "next/link";
import AdminAuthGate from "./AdminAuthGate";
import AdminHeader from "./AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El AdminAuthGate maneja toda la autenticación
  // No necesitamos verificar nada en el servidor
  return (
    <AdminAuthGate>
      <div className="min-h-screen bg-[#050816]">
        {/* Header */}
        <header className="border-b border-slate-800 bg-[#0B1220]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center gap-6">
                <Link 
                  href="/admin" 
                  className="text-lg font-semibold text-slate-50"
                >
                  FaktuGo Admin
                </Link>
                <nav className="hidden items-center gap-1 sm:flex">
                  <Link
                    href="/admin"
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/users"
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Usuarios
                  </Link>
                  <Link
                    href="/admin/plans"
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Planes
                  </Link>
                  <Link
                    href="/admin/tickets"
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Soporte
                  </Link>
                  <Link
                    href="/admin/admins"
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Admins
                  </Link>
                </nav>
              </div>
              <AdminHeader />
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 bg-[#0B1220] px-4 py-2 sm:hidden">
          <Link
            href="/admin"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Usuarios
          </Link>
          <Link
            href="/admin/plans"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Planes
          </Link>
          <Link
            href="/admin/tickets"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Soporte
          </Link>
          <Link
            href="/admin/admins"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Admins
          </Link>
        </nav>

        {/* Content */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </AdminAuthGate>
  );
}
