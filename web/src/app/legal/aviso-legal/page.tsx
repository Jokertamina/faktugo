import Link from "next/link";

export const metadata = {
  title: "Aviso Legal - FaktuGo",
  description: "Aviso legal e información sobre el titular del sitio web FaktuGo",
};

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-16 font-sans">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Aviso Legal</h1>
        <p className="mb-6 text-sm text-slate-400">
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la
          Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se exponen a continuación
          los datos identificativos del titular de este sitio web.
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">1. Datos del Titular</h2>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-2">
              <p>
                <strong className="text-slate-100">Titular:</strong>{" "}
                <span className="text-amber-400">Daniel Caruncho Mourente</span>
              </p>
              <p>
                <strong className="text-slate-100">NIF/CIF:</strong>{" "}
                <span className="text-amber-400">32708724X</span>
              </p>
              <p>
                <strong className="text-slate-100">Domicilio:</strong>{" "}
                <span className="text-amber-400">Rúa A Carreira, 57, 3C, 15630, Miño, A Coruña, España</span>
              </p>
              <p>
                <strong className="text-slate-100">Email de contacto:</strong>{" "}
                <a href="mailto:info@faktugo.com" className="text-blue-400 hover:underline">
                  info@faktugo.com
                </a>
              </p>
              <p>
                <strong className="text-slate-100">Sitio web:</strong>{" "}
                <a href="https://faktugo.com" className="text-blue-400 hover:underline">
                  https://faktugo.com
                </a>
              </p>
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">2. Objeto del Sitio Web</h2>
            <p>
              El presente sitio web tiene como finalidad ofrecer información y acceso a los servicios
              de FaktuGo, una plataforma de gestión de facturas para autónomos, empresas y gestorías.
            </p>
            <p className="mt-2">
              A través de este sitio, los usuarios pueden:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Conocer las características y funcionalidades de FaktuGo.</li>
              <li>Registrarse y crear una cuenta de usuario.</li>
              <li>Contratar planes de suscripción.</li>
              <li>Acceder al panel de gestión de facturas.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">3. Condiciones de Uso</h2>
            <p>
              El acceso y uso de este sitio web atribuye la condición de usuario e implica la
              aceptación plena de todas las disposiciones incluidas en este Aviso Legal, así como
              en la{" "}
              <Link href="/legal/privacidad" className="text-blue-400 hover:underline">
                Política de Privacidad
              </Link>
              , la{" "}
              <Link href="/legal/cookies" className="text-blue-400 hover:underline">
                Política de Cookies
              </Link>{" "}
              y los{" "}
              <Link href="/legal/terminos" className="text-blue-400 hover:underline">
                Términos y Condiciones
              </Link>
              .
            </p>
            <p className="mt-2">
              El usuario se compromete a hacer un uso adecuado de los contenidos y servicios
              ofrecidos, absteniéndose de emplearlos para actividades ilícitas o contrarias a
              la buena fe.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">4. Propiedad Intelectual e Industrial</h2>
            <p>
              Todos los contenidos del sitio web (textos, imágenes, gráficos, logotipos, iconos,
              software, nombres comerciales, marcas, diseños) son propiedad del titular o de
              terceros que han autorizado su uso, y están protegidos por las leyes españolas e
              internacionales de propiedad intelectual e industrial.
            </p>
            <p className="mt-2">
              Queda prohibida la reproducción, distribución, comunicación pública, transformación
              o cualquier otra forma de explotación de los contenidos sin autorización expresa
              del titular, salvo para uso personal y privado.
            </p>
            <p className="mt-2">
              El nombre "FaktuGo" y su logotipo son marcas del titular. Su uso sin autorización
              está prohibido.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">5. Exclusión de Garantías y Responsabilidad</h2>
            <p>
              El titular no garantiza la disponibilidad y continuidad del funcionamiento del sitio
              web. Cuando sea razonablemente posible, se advertirá previamente de las interrupciones
              en el funcionamiento.
            </p>
            <p className="mt-2">
              El titular no se hace responsable de:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>
                Los daños o perjuicios de cualquier tipo derivados de fallos o desconexiones en
                las redes de telecomunicaciones.
              </li>
              <li>
                Los daños causados por terceros mediante intromisiones ilegítimas fuera del
                control del titular.
              </li>
              <li>
                La falta de veracidad, exactitud, exhaustividad o actualidad de los contenidos.
              </li>
              <li>
                Los contenidos de sitios web de terceros a los que se pueda acceder desde enlaces
                del sitio.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">6. Enlaces a Terceros</h2>
            <p>
              Este sitio web puede contener enlaces a sitios web de terceros. El titular no tiene
              control sobre dichos sitios y no se responsabiliza de sus contenidos ni de sus
              políticas de privacidad.
            </p>
            <p className="mt-2">
              La inclusión de enlaces no implica ninguna asociación, fusión o participación con
              las entidades conectadas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">7. Protección de Datos</h2>
            <p>
              El tratamiento de datos personales se realiza conforme a lo establecido en el
              Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de Protección de Datos
              Personales y garantía de los derechos digitales (LOPDGDD).
            </p>
            <p className="mt-2">
              Para más información, consulta nuestra{" "}
              <Link href="/legal/privacidad" className="text-blue-400 hover:underline">
                Política de Privacidad
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">8. Legislación Aplicable y Jurisdicción</h2>
            <p>
              Las presentes condiciones se rigen por la legislación española. Para cualquier
              controversia que pudiera derivarse del acceso o uso de este sitio web, las partes
              se someten expresamente a los Juzgados y Tribunales de Madrid (España), con renuncia
              expresa a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">9. Modificaciones</h2>
            <p>
              El titular se reserva el derecho de modificar, en cualquier momento y sin previo
              aviso, la presentación y configuración del sitio web, así como el contenido de
              este Aviso Legal. Por ello, se recomienda revisarlo periódicamente.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-50">10. Contacto</h2>
            <p>
              Para cualquier consulta o reclamación relacionada con este Aviso Legal, puedes
              contactar con nosotros en:{" "}
              <a href="mailto:legal@faktugo.com" className="text-blue-400 hover:underline">
                legal@faktugo.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6">
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <Link href="/legal/terminos" className="hover:text-slate-200">
              Términos y Condiciones
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
