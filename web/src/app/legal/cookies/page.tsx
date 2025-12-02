import Link from "next/link";

export const metadata = {
  title: "Política de Cookies - FaktuGo",
  description: "Información sobre el uso de cookies en FaktuGo",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-16 font-sans">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Política de Cookies</h1>
        <p className="mb-6 text-sm text-slate-400">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">1. ¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando
              visitas un sitio web. Sirven para recordar tus preferencias, mantener tu sesión
              iniciada y ayudarnos a entender cómo usas el Servicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">2. Cookies que Utilizamos</h2>
            
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <h3 className="font-semibold text-emerald-300">Cookies Necesarias (Obligatorias)</h3>
                <p className="mt-1 text-slate-300">
                  Estas cookies son esenciales para el funcionamiento del sitio. No se pueden desactivar.
                </p>
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-2 text-left text-slate-400">Cookie</th>
                      <th className="pb-2 text-left text-slate-400">Finalidad</th>
                      <th className="pb-2 text-left text-slate-400">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 font-mono">sb-*-auth-token</td>
                      <td className="py-2">Autenticación de usuario (Supabase)</td>
                      <td className="py-2">1 año</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 font-mono">faktugo_cookie_consent</td>
                      <td className="py-2">Recordar tus preferencias de cookies</td>
                      <td className="py-2">1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <h3 className="font-semibold text-blue-300">Cookies de Preferencias (Opcionales)</h3>
                <p className="mt-1 text-slate-300">
                  Permiten recordar tus preferencias de configuración y personalización.
                </p>
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-2 text-left text-slate-400">Cookie</th>
                      <th className="pb-2 text-left text-slate-400">Finalidad</th>
                      <th className="pb-2 text-left text-slate-400">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 font-mono">faktugo_theme</td>
                      <td className="py-2">Preferencia de tema (claro/oscuro)</td>
                      <td className="py-2">1 año</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 font-mono">faktugo_locale</td>
                      <td className="py-2">Preferencia de idioma</td>
                      <td className="py-2">1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <h3 className="font-semibold text-amber-300">Cookies Analíticas (Opcionales)</h3>
                <p className="mt-1 text-slate-300">
                  Nos ayudan a entender cómo utilizas el Servicio para mejorarlo.
                </p>
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-2 text-left text-slate-400">Cookie</th>
                      <th className="pb-2 text-left text-slate-400">Finalidad</th>
                      <th className="pb-2 text-left text-slate-400">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 font-mono">_ga</td>
                      <td className="py-2">Google Analytics - identificador único</td>
                      <td className="py-2">2 años</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-2 font-mono">_ga_*</td>
                      <td className="py-2">Google Analytics - estado de sesión</td>
                      <td className="py-2">2 años</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                <h3 className="font-semibold text-purple-300">Cookies de Marketing (Opcionales)</h3>
                <p className="mt-1 text-slate-300">
                  Se utilizan para mostrarte anuncios relevantes y medir la efectividad de campañas.
                </p>
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-2 text-left text-slate-400">Cookie</th>
                      <th className="pb-2 text-left text-slate-400">Finalidad</th>
                      <th className="pb-2 text-left text-slate-400">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-slate-800">
                      <td className="py-2 font-mono">_fbp</td>
                      <td className="py-2">Facebook Pixel - seguimiento de conversiones</td>
                      <td className="py-2">3 meses</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-slate-400">
                  Nota: Actualmente no utilizamos cookies de marketing, pero nos reservamos el derecho
                  de implementarlas en el futuro previa actualización de esta política.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">3. Cómo Gestionar tus Preferencias</h2>
            <p>
              Puedes configurar tus preferencias de cookies en cualquier momento haciendo clic en
              el enlace "Configurar cookies" en el pie de página del sitio web.
            </p>
            <p className="mt-2">
              También puedes gestionar las cookies desde la configuración de tu navegador:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">4. Cookies de Terceros</h2>
            <p>
              Algunos servicios de terceros pueden establecer sus propias cookies. Te recomendamos
              revisar las políticas de privacidad de estos proveedores:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                  Supabase (Autenticación y Base de Datos)
                </a>
              </li>
              <li>
                <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                  Stripe (Pagos)
                </a>
              </li>
              <li>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                  Google Analytics
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">5. Actualizaciones</h2>
            <p>
              Esta política puede actualizarse periódicamente. Te notificaremos cualquier cambio
              significativo a través del banner de cookies o por email.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">6. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies, contacta con:{" "}
              <a href="mailto:privacidad@faktugo.com" className="text-blue-400 hover:underline">
                privacidad@faktugo.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6">
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <Link href="/legal/aviso-legal" className="hover:text-slate-200">
              Aviso Legal
            </Link>
            <Link href="/legal/terminos" className="hover:text-slate-200">
              Términos y Condiciones
            </Link>
            <Link href="/legal/privacidad" className="hover:text-slate-200">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
