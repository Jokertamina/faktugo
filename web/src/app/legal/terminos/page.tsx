import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones - FaktuGo",
  description: "Términos y condiciones de uso del servicio FaktuGo",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-16 font-sans">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Términos y Condiciones de Uso</h1>
        <p className="mb-6 text-sm text-slate-400">Última actualización: {new Date().toLocaleDateString("es-ES")}</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">1. Identificación del Responsable</h2>
            <p>
              El presente sitio web y la aplicación móvil FaktuGo (en adelante, "el Servicio") son
              propiedad y están operados por FaktuGo (en adelante, "nosotros" o "la Empresa").
            </p>
            <p className="mt-2">
              Datos de contacto: <a href="mailto:legal@faktugo.com" className="text-blue-400 hover:underline">legal@faktugo.com</a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">2. Aceptación de los Términos</h2>
            <p>
              Al acceder, registrarte o utilizar el Servicio, aceptas quedar vinculado por estos
              Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, no debes usar el Servicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">3. Descripción del Servicio</h2>
            <p>
              FaktuGo es una plataforma de gestión de facturas que permite a autónomos, empresas y
              gestorías:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Escanear y digitalizar facturas mediante la app móvil o panel web.</li>
              <li>Clasificar y organizar automáticamente los documentos por fecha y categoría.</li>
              <li>Sincronizar datos entre dispositivos (opcional).</li>
              <li>Enviar documentación a gestorías de forma automatizada.</li>
              <li>Recibir facturas por correo electrónico interno (según el plan contratado).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">4. Registro y Cuenta de Usuario</h2>
            <p>
              Para acceder a determinadas funcionalidades, deberás crear una cuenta proporcionando
              información veraz y actualizada. Eres responsable de mantener la confidencialidad de
              tus credenciales y de todas las actividades realizadas desde tu cuenta.
            </p>
            <p className="mt-2">
              Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos términos
              o que realicen un uso fraudulento del Servicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">5. Planes y Pagos</h2>
            <p>
              FaktuGo ofrece diferentes planes de suscripción con distintos límites y funcionalidades.
              Los precios y características de cada plan se detallan en la página de precios.
            </p>
            <p className="mt-2">
              Los pagos se procesan de forma segura a través de Stripe. Al suscribirte a un plan de
              pago, autorizas el cargo recurrente según la periodicidad elegida.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">6. Cancelación y Reembolsos</h2>
            <p>
              <strong className="text-slate-100">Cancelación:</strong> Puedes cancelar tu suscripción
              en cualquier momento desde el portal de facturación. Al cancelar:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>No se realizarán más cargos a partir del siguiente ciclo de facturación.</li>
              <li>
                Mantendrás acceso a las funcionalidades de tu plan hasta el final del periodo
                ya pagado.
              </li>
              <li>
                Al finalizar el periodo, tu cuenta pasará automáticamente al plan gratuito.
              </li>
            </ul>
            <p className="mt-3">
              <strong className="text-slate-100">Política de reembolsos:</strong> Como norma general,
              <strong> las suscripciones no son reembolsables</strong> una vez iniciado el periodo
              de facturación. Esto incluye:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Cancelaciones voluntarias antes de finalizar el periodo contratado.</li>
              <li>Cambios a un plan inferior (downgrade).</li>
              <li>Falta de uso del servicio durante el periodo de suscripción.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-slate-100">Excepciones:</strong> Podremos considerar reembolsos
              totales o parciales en los siguientes casos excepcionales, a nuestra discreción:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>
                Errores técnicos graves que impidan el uso del servicio durante un periodo
                prolongado y que no hayamos podido resolver.
              </li>
              <li>Cargos duplicados o errores en la facturación.</li>
              <li>
                Circunstancias excepcionales debidamente justificadas.
              </li>
            </ul>
            <p className="mt-2">
              Para solicitar un reembolso excepcional, contacta con{" "}
              <a href="mailto:soporte@faktugo.com" className="text-blue-400 hover:underline">
                soporte@faktugo.com
              </a>{" "}
              explicando tu situación.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">7. Procesamiento con Inteligencia Artificial</h2>
            <p>
              FaktuGo utiliza servicios de inteligencia artificial de terceros (OpenAI) para
              procesar y analizar las facturas que subes al servicio. Esto incluye:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Extracción automática de datos (fecha, importe, proveedor, etc.).</li>
              <li>Clasificación y categorización de documentos.</li>
              <li>Detección del tipo de documento (factura, ticket, etc.).</li>
            </ul>
            <p className="mt-2">
              Al usar el Servicio, aceptas que tus documentos sean procesados por estos sistemas
              de IA. Según la política de OpenAI para uso de API, los datos enviados no se
              utilizan para entrenar sus modelos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">8. Propiedad Intelectual</h2>
            <p>
              Todos los contenidos del Servicio (textos, gráficos, logos, iconos, software) son
              propiedad de FaktuGo o de sus licenciantes y están protegidos por las leyes de
              propiedad intelectual.
            </p>
            <p className="mt-2">
              Los documentos y facturas que subas al Servicio siguen siendo de tu propiedad.
              FaktuGo solo los procesa para prestarte el servicio contratado.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">9. Obligaciones del Usuario y Usos Prohibidos</h2>
            <p>
              Al utilizar el Servicio, te comprometes a:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Proporcionar información veraz y actualizada en tu registro.</li>
              <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Usar el Servicio únicamente para fines legales y conforme a estos Términos.</li>
              <li>No compartir tu cuenta con terceros.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-slate-100">Usos prohibidos:</strong> Está expresamente prohibido:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Usar el Servicio para actividades ilegales, fraudulentas o que infrinjan derechos de terceros.</li>
              <li>Subir contenido ilícito, difamatorio, ofensivo o que vulnere derechos de propiedad intelectual.</li>
              <li>Intentar acceder a cuentas de otros usuarios o a sistemas internos de FaktuGo.</li>
              <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente del Servicio.</li>
              <li>Usar el Servicio para enviar spam, malware o contenido malicioso.</li>
              <li>Sobrecargar intencionadamente los servidores o interferir con el funcionamiento del Servicio.</li>
              <li>Revender, redistribuir o explotar comercialmente el Servicio sin autorización.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">10. Suspensión y Cancelación de Cuentas</h2>
            <p>
              Nos reservamos el derecho de suspender o cancelar tu cuenta, sin previo aviso ni
              reembolso, en los siguientes casos:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Incumplimiento de estos Términos o de la legislación aplicable.</li>
              <li>Uso fraudulento o abusivo del Servicio.</li>
              <li>Actividades que pongan en riesgo la seguridad o integridad del Servicio.</li>
              <li>Falta de pago de las suscripciones contratadas.</li>
              <li>Inactividad prolongada de la cuenta (más de 24 meses).</li>
              <li>Solicitud de autoridades competentes.</li>
            </ul>
            <p className="mt-2">
              En caso de suspensión, intentaremos notificarte la causa cuando sea posible.
              Podrás solicitar la exportación de tus datos antes de la cancelación definitiva.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">11. Limitación de Responsabilidad</h2>
            <p>
              FaktuGo no es un servicio de asesoría fiscal ni contable. La clasificación automática
              de facturas es orientativa y no sustituye el criterio de un profesional.
            </p>
            <p className="mt-2">
              <strong className="text-slate-100">En la máxima medida permitida por la ley:</strong>
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>
                El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías
                de ningún tipo, expresas o implícitas.
              </li>
              <li>
                No garantizamos que el Servicio sea ininterrumpido, libre de errores o completamente
                seguro.
              </li>
              <li>
                No nos hacemos responsables de pérdidas indirectas, incidentales, especiales o
                consecuentes, incluyendo pérdida de beneficios, datos o negocio.
              </li>
              <li>
                Nuestra responsabilidad total frente a ti, por cualquier causa, se limitará al
                importe que hayas pagado por el Servicio en los últimos 12 meses.
              </li>
            </ul>
            <p className="mt-2">
              Estas limitaciones no afectan a los derechos que te correspondan como consumidor
              según la legislación aplicable.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">12. Indemnización</h2>
            <p>
              Aceptas indemnizar y mantener indemne a FaktuGo, sus directivos, empleados y
              colaboradores, frente a cualquier reclamación, daño, pérdida, responsabilidad,
              costes y gastos (incluyendo honorarios legales razonables) derivados de:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Tu uso del Servicio o incumplimiento de estos Términos.</li>
              <li>La infracción de derechos de terceros.</li>
              <li>El contenido de los documentos que subas al Servicio.</li>
              <li>Cualquier actividad ilícita realizada a través de tu cuenta.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">13. Fuerza Mayor</h2>
            <p>
              FaktuGo no será responsable por incumplimientos o retrasos en la prestación del
              Servicio causados por circunstancias fuera de nuestro control razonable, incluyendo
              pero no limitado a:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Desastres naturales, epidemias o pandemias.</li>
              <li>Guerras, terrorismo, disturbios civiles.</li>
              <li>Fallos de terceros proveedores (hosting, pagos, telecomunicaciones).</li>
              <li>Ciberataques o brechas de seguridad ajenas a nuestra negligencia.</li>
              <li>Cambios legislativos o acciones gubernamentales.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">14. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las
              modificaciones se comunicarán a través del Servicio o por email. El uso continuado
              tras la notificación implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">15. Legislación Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos se rigen por la legislación española. Para cualquier controversia
              derivada de la interpretación o ejecución de estos Términos, las partes se someten
              expresamente a los Juzgados y Tribunales de la ciudad de Madrid (España), con
              renuncia expresa a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">16. Divisibilidad</h2>
            <p>
              Si alguna disposición de estos Términos fuera declarada nula o inaplicable por
              un tribunal competente, las restantes disposiciones seguirán siendo válidas y
              aplicables. La disposición nula se sustituirá por otra válida que refleje la
              intención original de las partes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">17. Acuerdo Completo</h2>
            <p>
              Estos Términos, junto con la Política de Privacidad, la Política de Cookies y
              el Aviso Legal, constituyen el acuerdo completo entre tú y FaktuGo en relación
              con el uso del Servicio, y sustituyen cualquier acuerdo o comunicación anterior.
            </p>
            <p className="mt-2">
              El hecho de que FaktuGo no ejerza cualquier derecho o recurso previsto en estos
              Términos no constituirá una renuncia al mismo.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">18. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos Términos, puedes contactarnos en:{" "}
              <a href="mailto:legal@faktugo.com" className="text-blue-400 hover:underline">
                legal@faktugo.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6">
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <Link href="/legal/aviso-legal" className="hover:text-slate-200">
              Aviso Legal
            </Link>
            <Link href="/legal/privacidad" className="hover:text-slate-200">
              Política de Privacidad
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
