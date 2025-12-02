import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad - FaktuGo",
  description: "Política de privacidad y protección de datos de FaktuGo",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-16 font-sans">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Política de Privacidad</h1>
        <p className="mb-6 text-sm text-slate-400">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">1. Responsable del Tratamiento</h2>
            <p>
              FaktuGo es el responsable del tratamiento de los datos personales recogidos a través
              del sitio web y la aplicación móvil.
            </p>
            <p className="mt-2">
              Contacto del Delegado de Protección de Datos:{" "}
              <a href="mailto:privacidad@faktugo.com" className="text-blue-400 hover:underline">
                privacidad@faktugo.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">2. Datos que Recopilamos</h2>
            <p>Recopilamos los siguientes tipos de datos:</p>
            <ul className="mt-2 list-inside list-disc space-y-2 pl-4">
              <li>
                <strong className="text-slate-100">Datos de registro:</strong> nombre, apellidos,
                email, tipo de cuenta (autónomo/empresa), nombre comercial.
              </li>
              <li>
                <strong className="text-slate-100">Datos de facturación:</strong> información
                necesaria para procesar pagos a través de Stripe.
              </li>
              <li>
                <strong className="text-slate-100">Documentos subidos:</strong> facturas, tickets y
                otros documentos que decidas almacenar en el Servicio.
              </li>
              <li>
                <strong className="text-slate-100">Datos de uso:</strong> estadísticas de uso,
                preferencias, configuración de la cuenta.
              </li>
              <li>
                <strong className="text-slate-100">Datos técnicos:</strong> dirección IP, tipo de
                dispositivo, navegador, sistema operativo (con fines de seguridad y mejora).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">3. Finalidad del Tratamiento</h2>
            <p>Utilizamos tus datos para:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Prestarte el servicio de gestión de facturas contratado.</li>
              <li>Gestionar tu cuenta de usuario y autenticación.</li>
              <li>Procesar pagos y gestionar suscripciones.</li>
              <li>Enviarte comunicaciones relacionadas con el servicio (actualizaciones, cambios).</li>
              <li>Mejorar el Servicio mediante análisis de uso agregados.</li>
              <li>Cumplir con obligaciones legales.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">4. Base Legal del Tratamiento</h2>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                <strong className="text-slate-100">Ejecución del contrato:</strong> necesario para
                prestarte el servicio.
              </li>
              <li>
                <strong className="text-slate-100">Consentimiento:</strong> para comunicaciones
                comerciales y cookies no esenciales.
              </li>
              <li>
                <strong className="text-slate-100">Interés legítimo:</strong> para mejorar el
                servicio y prevenir fraudes.
              </li>
              <li>
                <strong className="text-slate-100">Obligación legal:</strong> conservación de datos
                fiscales según normativa.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">5. Destinatarios de los Datos</h2>
            <p>Tus datos pueden ser comunicados a:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>
                <strong className="text-slate-100">Vercel:</strong> proveedor de alojamiento y
                entrega de contenido (hosting/CDN) de la web de FaktuGo.
              </li>
              <li>
                <strong className="text-slate-100">Supabase:</strong> proveedor de infraestructura
                y base de datos (servidores en la UE).
              </li>
              <li>
                <strong className="text-slate-100">Stripe:</strong> procesador de pagos (cumple
                PCI-DSS).
              </li>
              <li>
                <strong className="text-slate-100">Resend:</strong> servicio de envío de emails
                transaccionales.
              </li>
              <li>
                <strong className="text-slate-100">OpenAI:</strong> para el procesamiento automático
                de facturas mediante inteligencia artificial (extracción de datos, clasificación).
                Los documentos se envían a los servidores de OpenAI para su análisis. OpenAI no
                utiliza estos datos para entrenar sus modelos según su política de uso de API.
              </li>
              <li>
                <strong className="text-slate-100">Tu gestoría:</strong> si activas el envío
                automático de facturas.
              </li>
            </ul>
            <p className="mt-2">
              No vendemos ni cedemos tus datos personales a terceros con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">6. Transferencias Internacionales</h2>
            <p>
              Algunos de nuestros proveedores pueden procesar datos fuera del Espacio Económico
              Europeo. En esos casos, nos aseguramos de que existan garantías adecuadas (Cláusulas
              Contractuales Tipo, decisiones de adecuación, etc.).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">7. Conservación de Datos</h2>
            <p>Conservamos tus datos durante:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>
                <strong className="text-slate-100">Datos de cuenta:</strong> mientras mantengas tu
                cuenta activa y hasta 5 años después de la baja.
              </li>
              <li>
                <strong className="text-slate-100">Facturas y documentos:</strong> según los
                plazos legales de conservación fiscal (mínimo 4-6 años).
              </li>
              <li>
                <strong className="text-slate-100">Datos de pago:</strong> según requisitos
                legales y de Stripe.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">8. Tus Derechos</h2>
            <p>Conforme al RGPD, puedes ejercer los siguientes derechos:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li><strong className="text-slate-100">Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
              <li><strong className="text-slate-100">Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong className="text-slate-100">Supresión:</strong> solicitar la eliminación de tus datos ("derecho al olvido").</li>
              <li><strong className="text-slate-100">Portabilidad:</strong> recibir tus datos en formato estructurado y transmitirlos a otro responsable.</li>
              <li><strong className="text-slate-100">Oposición:</strong> oponerte a determinados tratamientos, incluyendo el marketing directo.</li>
              <li><strong className="text-slate-100">Limitación:</strong> restringir el tratamiento en ciertos casos.</li>
              <li>
                <strong className="text-slate-100">Retirada del consentimiento:</strong> cuando el tratamiento se base en tu
                consentimiento, puedes retirarlo en cualquier momento sin que ello afecte a la licitud del tratamiento
                anterior a su retirada.
              </li>
              <li>
                <strong className="text-slate-100">No ser objeto de decisiones automatizadas:</strong> tienes derecho a no
                ser objeto de una decisión basada únicamente en el tratamiento automatizado que produzca efectos jurídicos
                sobre ti. El análisis de facturas por IA es una función de ayuda y no produce decisiones automatizadas
                con efectos jurídicos.
              </li>
            </ul>
            <p className="mt-3">
              <strong className="text-slate-100">Cómo ejercer tus derechos:</strong> Puedes contactarnos en{" "}
              <a href="mailto:privacidad@faktugo.com" className="text-blue-400 hover:underline">
                privacidad@faktugo.com
              </a>
              {" "}indicando el derecho que deseas ejercer y adjuntando copia de tu DNI o documento identificativo.
              Responderemos en el plazo máximo de un mes desde la recepción de tu solicitud.
            </p>
            <p className="mt-2">
              <strong className="text-slate-100">Reclamación:</strong> Si consideras que tus derechos han sido vulnerados,
              puedes presentar una reclamación ante la{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Agencia Española de Protección de Datos (AEPD)
              </a>
              , C/ Jorge Juan 6, 28001 Madrid.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">9. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en
              tránsito (HTTPS/TLS), cifrado en reposo, control de accesos, copias de seguridad y
              monitorización de seguridad.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">10. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos los cambios
              significativos por email o mediante un aviso en el Servicio.
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
            <Link href="/legal/cookies" className="hover:text-slate-200">
              Política de Cookies
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
