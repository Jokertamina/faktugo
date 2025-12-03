import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides, getGuideBySlug } from "../guides";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guía no encontrada",
    };
  }

  const url = `https://faktugo.com/guia/${guide.slug}`;

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `/guia/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  let content: React.ReactNode;

  switch (guide!.slug) {
    case "como-organizar-facturas-autonomo":
      content = <ComoOrganizarFacturasAutonomo />;
      break;
    case "guardar-tickets-facturas-hacienda":
      content = <GuardarTicketsFacturasHacienda />;
      break;
    case "obligaciones-facturacion-autonomo-espana":
      content = <ObligacionesFacturacionAutonomoEspana />;
      break;
    case "enviar-facturas-gestoria-trimestre":
      content = <EnviarFacturasGestoriaTrimestre />;
      break;
    default:
      notFound();
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <main className="mx-auto max-w-4xl px-6 py-16 space-y-10">
        <nav className="text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-200">
            Inicio
          </Link>
          <span className="mx-1">/</span>
          <Link href="/guia" className="hover:text-slate-200">
            Guías
          </Link>
          <span className="mx-1">/</span>
          <span className="text-slate-300">{guide!.title}</span>
        </nav>

        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">GUÍA</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {guide!.title}
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">{guide!.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>{guide!.readingTimeMinutes} min de lectura</span>
            <span className="hidden sm:inline">·</span>
            <div className="flex flex-wrap gap-1">
              {guide!.keywords.slice(0, 3).map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </header>

        <article className="space-y-8 text-sm text-slate-200 sm:text-base">
          {content}
        </article>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-[#0B1220] p-6 sm:p-7">
          <h2 className="text-base font-semibold text-slate-50 sm:text-lg">
            Pon tus facturas en piloto automático con FaktuGo
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Si quieres aplicar esta guía sin pelearte con carpetas y nombres de archivo, puedes usar
            FaktuGo para escanear tickets, clasificar facturas por mes o semana y preparar todo para tu
            gestoría en minutos.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-[#2A5FFF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#224bcc]"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/como-funciona"
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:border-slate-300 hover:bg-slate-900/60"
            >
              Ver cómo funciona FaktuGo
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function ComoOrganizarFacturasAutonomo() {
  return (
    <>
      <section className="space-y-3">
        <p>
          Cada trimestre llega el mismo momento de pánico: buscar facturas en el correo, en carpetas
          del ordenador, en cajas de zapatos con tickets arrugados… y tu gestoría pidiéndote "todo
          antes del día X".
        </p>
        <p>
          Organizar bien tus facturas no es solo una manía de orden. Te ahorra dinero, tiempo y
          problemas con Hacienda. En esta guía verás, paso a paso, cómo montar un sistema sencillo
          que puedas mantener incluso en los meses más cañeros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          1. Qué facturas tienes que guardar (y por qué)
        </h2>
        <p>Antes de hablar de carpetas y apps, aclaremos el "qué":</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Facturas emitidas</strong>: todo lo que tú facturas a tus clientes. Sirve para
            acreditar tus ingresos.
          </li>
          <li>
            <strong>Facturas recibidas y tickets</strong>: gasolina, hoteles, software, material,
            comidas deducibles… todo lo que justifica gastos y deducciones.
          </li>
          <li>
            <strong>Plazo de conservación</strong>: en general, mínimo 4 años desde el final del
            ejercicio fiscal. Muchos asesores recomiendan guardar 6 años por seguridad.
          </li>
        </ul>
        <p>
          Si pierdes una factura que te daba derecho a deducir un gasto, estás dejando dinero en la
          mesa. Si pierdes una factura emitida, puedes tener problemas ante una comprobación.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          2. Errores típicos al organizar facturas
        </h2>
        <p>Estos son los patrones que se repiten en autónomos y pequeñas empresas:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Todo mezclado en una única carpeta "Facturas 2025"</strong>: difícil filtrar por
            trimestre o por tipo de gasto.
          </li>
          <li>
            <strong>Cada proveedor nombra los PDF como quiere</strong>:
            <span className="whitespace-nowrap">`factura_123.pdf`,</span>
            <span className="whitespace-nowrap">`documento.pdf`,</span>
            <span className="whitespace-nowrap">`FCT-2025-03-001.pdf`</span>… sin criterio.
          </li>
          <li>
            <strong>Tickets en papel sin digitalizar</strong>: se borran, se rompen o simplemente
            desaparecen.
          </li>
          <li>
            <strong>Uso de WhatsApp o correo como "archivo"</strong>: buscar algo ahí meses después es
            un infierno.
          </li>
        </ul>
        <p>
          La buena noticia: no necesitas un ERP gigante para salir de aquí. Con una buena estructura
          y una app que no moleste, puedes dejarlo bastante automatizado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          3. Un sistema de carpetas que funciona (meses o semanas)
        </h2>
        <p>Empieza por algo que puedas entender incluso medio dormido.</p>
        <h3 className="text-base font-semibold text-slate-50">Opción A: por meses</h3>
        <p>Estructura propuesta:</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900/70 p-4 text-[11px] sm:text-xs">
{`/Facturas
  /2025
    /01
    /02
    /03
    ...`}
        </pre>
        <p>
          Si organizas las facturas manualmente en tu ordenador o en tu nube, puedes usar una
          convención de nombres como esta (solo es un ejemplo de sistema, no algo que FaktuGo haga
          hoy automáticamente):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>`EMITIDAS_2025-01_ClienteX.pdf`</li>
          <li>`RECIBIDAS_2025-01_REPSOL_45-60euros_gasolina.pdf`</li>
          <li>`RECIBIDAS_2025-01_AMAZON_material-oficina.pdf`</li>
        </ul>
        <h3 className="text-base font-semibold text-slate-50">Opción B: por semanas</h3>
        <p>
          Si tienes mucho volumen, puedes bajar al nivel semana para detectar errores y olvidos antes:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900/70 p-4 text-[11px] sm:text-xs">
{`/Facturas
  /2025
    /S01
    /S02
    /S03
    ...`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          4. Cómo nombrar los archivos para encontrarlos rápido
        </h2>
        <p>Un buen nombre de archivo vale oro. Una convención sencilla:</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900/70 p-4 text-[11px] sm:text-xs">
{`TIPO_FECHA_PROVEEDOR_IMPORTE_CONCEPTO.pdf`}
        </pre>
        <p>Por ejemplo:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>`REC_2025-01-15_REPSOL_43-50_gasolina.pdf`</li>
          <li>`EMI_2025-02-28_ClienteACME_1210-00_servicios-consultoria.pdf`</li>
        </ul>
        <p>Recomendaciones:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>TIPO</strong>: `REC` (recibida) o `EMI` (emitida).
          </li>
          <li>
            <strong>FECHA</strong>: siempre `AAAA-MM-DD`.
          </li>
          <li>
            <strong>IMPORTE</strong>: con guion en lugar de coma (`1210-00`).
          </li>
          <li>
            <strong>CONCEPTO</strong>: corto pero claro: `gasolina`, `software`, `alquiler`,
            `hosting`…
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          5. Digitaliza todos los tickets en el momento
        </h2>
        <p>
          El punto crítico para un autónomo suelen ser los <strong>tickets físicos</strong>:
          repostajes, peajes, parkings, restaurantes, pequeñas compras…
        </p>
        <p>
          Si los dejas en la cartera, desaparecerán. La regla más efectiva es:
          <span className="block font-medium text-slate-100">
            Pago · foto del ticket · a la carpeta correcta (o a la app).
          </span>
        </p>
        <p>Opciones:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Usar la cámara del móvil + Google Drive / Dropbox (gestión manual).
          </li>
          <li>
            Usar una app específica de facturas y tickets que haga la foto, extraiga los datos y
            coloque el documento en la carpeta correcta.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          6. Ejemplo de flujo ideal con una app de facturas
        </h2>
        <p>Con una app como FaktuGo, tu día a día podría ser así:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Haces la compra (gasolina, comida, material…).</li>
          <li>Abres la app de facturas en el móvil.</li>
          <li>
            Haces la foto del ticket: la app detecta fecha, proveedor e importe automáticamente.
          </li>
          <li>
            La app clasifica y envía el archivo a la carpeta del mes o semana correspondiente y
            asigna una categoría (gasolina, restaurante, software…).
          </li>
          <li>
            Cuando quieras, revisas todo en el panel web y haces los últimos ajustes antes de
            enviarlo a tu gestoría.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          7. Preparar el envío a la gestoría sin sufrir
        </h2>
        <p>
          Una vez al mes (or al trimestre), puedes hacer este mini ritual para que el cierre sea
          tranquilo:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Revisar rápidamente la carpeta del periodo y comprobar que no falta ningún proveedor
            importante.
          </li>
          <li>
            Exportar todo en un ZIP por mes o trimestre desde tu sistema o desde la app que uses.
          </li>
          <li>
            Enviar un único correo a tu gestoría con asunto claro (por ejemplo: "Facturas Q1 2025
            · Nombre Autónomo").
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          8. Checklist rápido para saber si lo tienes bien montado
        </h2>
        <p>Usa esta lista como referencia rápida:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Mis facturas recientes están digitalizadas (no dependo del papel).</li>
          <li>Uso una única estructura de carpetas por año + mes o año + semana.</li>
          <li>Los archivos tienen nombres consistentes y fáciles de entender.</li>
          <li>Puedo encontrar una factura concreta en menos de 30 segundos.</li>
          <li>Tengo un ritual mensual o trimestral para preparar el envío a la gestoría.</li>
          <li>Tengo una copia en la nube o un backup de mis facturas.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          9. Cómo te ayuda FaktuGo en todo esto
        </h2>
        <p>
          Muchas de estas ideas las puedes aplicar con carpetas y disciplina, pero FaktuGo está
          pensado justo para aliviarte esa carga:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>App móvil para hacer la foto al momento y no perder tickets.</li>
          <li>Clasificación automática por mes o semana y por proveedor.</li>
          <li>
            Panel web para revisar y corregir desde el ordenador cuando tengas un hueco.
          </li>
          <li>
            Exportación por periodo para enviar a tu gestoría sin pensar ni buscar archivos uno a
            uno.
          </li>
        </ul>
      </section>
    </>
  );
}

function GuardarTicketsFacturasHacienda() {
  return (
    <>
      <section className="space-y-3">
        <p>
          Guardar bien tickets y facturas no es solo una cuestión de orden. Son los documentos que
          justifican tus ingresos y tus gastos ante Hacienda. Si se pierden, se rompen o no se ven
          bien, puedes acabar pagando más impuestos de los que te tocaría o teniendo problemas en una
          revisión.
        </p>
        <p>
          Esta guía te da una visión práctica (no jurídica) de qué debes guardar, durante cuánto
          tiempo y cómo organizarlo para que, si algún día hay una comprobación, tengas todo localizable
          en minutos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          1. Qué documentos importan de verdad para Hacienda
        </h2>
        <p>En la práctica, hay tres tipos de documentos clave:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Facturas emitidas</strong>: todo lo que tú facturas a tus clientes. Sirven para
            acreditar tus ingresos.
          </li>
          <li>
            <strong>Facturas recibidas y tickets deducibles</strong>: gasolina, peajes, hoteles,
            restauración, software, alquiler de oficina… justifican tus gastos y deducciones.
          </li>
          <li>
            <strong>Justificantes de cuotas y seguros</strong>: recibos de la cuota de autónomos,
            seguros, etc. que también forman parte de tus gastos.
          </li>
        </ul>
        <p>
          Si pierdes una factura de gasto, pierdes una deducción. Si pierdes una factura emitida, puede
          haber diferencias entre lo que declaras y lo que se ve en tus movimientos bancarios.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          2. Papel vs digital: qué acepta Hacienda
        </h2>
        <p>
          La normativa española permite la conservación de facturas en formato digital siempre que se
          garantice la <strong>legibilidad</strong>, la <strong>integridad</strong> y la
          <strong> trazabilidad</strong> del documento. En la práctica, la mayoría de inspecciones se
          resuelven revisando PDFs o imágenes bien escaneadas.
        </p>
        <p>
          Sin embargo, si quieres destruir el papel, es importante que lo consultes con tu asesoría y
          te asegures de cumplir la normativa específica de digitalización certificada. Esta guía no es
          asesoramiento jurídico; su objetivo es ayudarte a ser ordenado y minimizar riesgos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          3. Cuánto tiempo hay que conservar tickets y facturas
        </h2>
        <p>
          Como regla general, los documentos relacionados con impuestos deben conservarse al menos
          <strong> cuatro años</strong>, que es el plazo de prescripción habitual en el ámbito
          tributario español.
        </p>
        <p>
          En la práctica, muchas gestorías recomiendan conservarlos <strong>seis años</strong> para
          cubrir posibles desajustes de ejercicios y revisiones más amplias. Si tienes dudas, lo más
          prudente es seguir el criterio de tu asesor.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          4. Errores típicos al guardar tickets y facturas
        </h2>
        <p>Estos son algunos patrones que conviene evitar:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Tickets sueltos en la cartera o en el coche</strong>: se borran, se rompen o
            desaparecen justo cuando los necesitas.
          </li>
          <li>
            <strong>Fotos sueltas en la galería del móvil</strong>: meses después es casi imposible
            saber qué foto corresponde a qué gasto o trimestre.
          </li>
          <li>
            <strong>Facturas mezcladas con documentos personales</strong>: dificulta encontrar lo que
            te pide la gestoría o la Agencia Tributaria.
          </li>
          <li>
            <strong>No apuntar el concepto</strong>: no saber si un ticket era de gasolina, comida con
            cliente o una compra personal.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          5. Sistema mínimo para no sufrir: digitaliza y ordena por periodos
        </h2>
        <p>
          No necesitas un ERP gigante. Con un sistema sencillo por periodos y una rutina mínima puedes
          tenerlo bajo control:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Define una estructura clara (por ejemplo, carpetas por <strong>año</strong> y
            <strong> mes</strong>).
          </li>
          <li>
            Digitaliza los tickets lo antes posible (idealmente el mismo día) y guarda el PDF o la
            imagen en la carpeta del mes.
          </li>
          <li>
            Asegúrate de que el archivo se lee bien: datos completos, sin cortes, sin reflejos.
          </li>
          <li>
            Usa nombres de archivo razonables o una herramienta que te permita buscar por proveedor,
            fecha o importe.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          6. Cómo hacer fotos y escaneos que sirvan de verdad
        </h2>
        <p>Al hacer la foto o el escaneo de un ticket o factura:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Apóyalo sobre una superficie plana y con buen contraste.</li>
          <li>Asegúrate de que se ve <strong>completo</strong>, sin cortar bordes ni datos clave.</li>
          <li>
            Evita brillos y sombras fuertes; si hace falta, haz dos fotos o repite hasta que quede
            legible.
          </li>
          <li>Comprueba que se distinguen bien fecha, proveedor e importe total.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          7. Rutina mensual o trimestral para ir al día
        </h2>
        <p>
          Más que hacer grandes limpiezas una vez al año, es mucho más sostenible dedicarle unos
          minutos cada mes o cada trimestre:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Revisa la carpeta del periodo y comprueba que no falten gastos importantes.</li>
          <li>
            Agrupa los documentos por tipo (gasolina, dietas, software…) si tu asesor lo recomienda.
          </li>
          <li>
            Prepara un único paquete para tu gestoría (carpeta compartida o ZIP) y envíalo siempre con
            un asunto claro.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          8. Cómo encaja FaktuGo en este esquema
        </h2>
        <p>
          Aunque puedes aplicar muchas de estas ideas con carpetas y disciplina, FaktuGo está pensado
          para automatizar gran parte del proceso:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Haces la foto del ticket o subes el PDF y el sistema analiza si realmente es una factura
            válida.
          </li>
          <li>
            Propone proveedor, fecha, importe y una categoría de gasto basándose en el contenido del
            documento.
          </li>
          <li>
            Coloca cada factura en el periodo mensual correspondiente, evitando duplicados obvios.
          </li>
          <li>
            Desde el panel puedes revisar, filtrar y, cuando toque, enviar las facturas a tu gestoría
            por email.
          </li>
        </ul>
        <p>
          La idea es que, cuando llegue el trimestre, no tengas que perseguir papeles ni correos:
          simplemente revisas lo que ya está en FaktuGo y lo compartes con tu asesor.
        </p>
      </section>
    </>
  );
}

function ObligacionesFacturacionAutonomoEspana() {
  return (
    <>
      <section className="space-y-3">
        <p>
          Si trabajas como autónomo en España, la palabra "facturas" está en casi todo lo que haces:
          ingresos, gastos, declaraciones trimestrales… Tener claro qué obligaciones básicas tienes te
          evita sustos y te ayuda a hablar el mismo idioma que tu gestoría.
        </p>
        <p>
          Esta guía es una explicación práctica y general, no asesoramiento jurídico. Las normas pueden
          cambiar y tu caso concreto puede tener matices, así que si tienes dudas serias coméntalo
          siempre con tu asesoría.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          1. Cuándo tienes que emitir factura
        </h2>
        <p>Como norma general, deberías emitir factura cuando:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Prestes un servicio o vendas un producto en el ejercicio de tu actividad.</li>
          <li>Tu cliente sea otra empresa, autónomo o una administración pública.</li>
          <li>Tu cliente te la pida expresamente (aunque sea un particular).</li>
        </ul>
        <p>
          Hay operaciones muy pequeñas en las que en la práctica solo se emite un ticket simplificado,
          pero incluso en esos casos es buena idea tener un justificante claro de qué has cobrado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          2. Qué datos mínimos debe llevar una factura
        </h2>
        <p>
          Para que una factura tenga sentido a efectos fiscales y para tu propia organización, debería
          incluir al menos:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Nombre completo o razón social del emisor y del cliente.</li>
          <li>NIF/CIF de ambos (salvo ciertos casos de tickets simplificados).</li>
          <li>Dirección fiscal del emisor.</li>
          <li>Número de factura y serie (numeración correlativa por serie).</li>
          <li>Fecha de emisión y, si aplica, fecha de la operación.</li>
          <li>Descripción del servicio o producto facturado.</li>
          <li>Base imponible, tipo de IVA aplicado e importe de IVA.</li>
          <li>Importe total a pagar y, si procede, retención de IRPF.</li>
        </ul>
        <p>
          Aunque trabajes con plantillas o programas de facturación, conviene revisar que todo esto se
          está rellenando correctamente, sobre todo la numeración y las fechas.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          3. Registro de ingresos y gastos
        </h2>
        <p>
          Más allá de emitir y guardar facturas, la clave está en llevar al día qué entra y qué sale.
          Lo habitual es mantener, como mínimo:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Un <strong>listado de facturas emitidas</strong> con número, fecha, cliente, base, IVA y
            total.
          </li>
          <li>
            Un <strong>listado de facturas recibidas y tickets</strong> con fecha, proveedor, concepto
            e importe.
          </li>
        </ul>
        <p>
          Muchos autónomos lo llevan en hojas de cálculo, otros usan software contable completo y otros
          una solución intermedia como FaktuGo para tener al menos toda la documentación bien ordenada
          y localizable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          4. Relación entre facturas y declaraciones trimestrales
        </h2>
        <p>
          Tus declaraciones de impuestos (IVA, pagos a cuenta de IRPF, etc.) se basan en la información
          de tus facturas emitidas y recibidas. Si faltan documentos o hay desorden, tu asesoría tendrá
          que adivinar o ir a ciegas.
        </p>
        <p>
          Un buen sistema de facturación no solo genera documentos bonitos, sino que te permite saber en
          todo momento:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cuánto has facturado en un periodo determinado.</li>
          <li>Qué gastos deducibles tienes registrados.</li>
          <li>Qué facturas siguen pendientes de cobro o de revisar.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          5. Errores habituales de facturación en autónomos
        </h2>
        <p>Algunos fallos que se repiten mucho:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Numeraciones desordenadas o con huecos que luego son difíciles de explicar.
          </li>
          <li>Facturas emitidas sin datos completos del cliente.</li>
          <li>Tickets importantes sin digitalizar o sin asociar a ningún trimestre.</li>
          <li>
            No guardar las facturas de gasto suficientes para justificar deducciones que se han aplicado
            en la declaración.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          6. Cómo encaja FaktuGo en estas obligaciones
        </h2>
        <p>
          FaktuGo no sustituye al criterio de tu asesoría ni presenta impuestos por ti, pero sí te ayuda
          con la parte más pesada: recopilar y tener a mano toda la documentación que da soporte a tus
          declaraciones.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Te permite digitalizar y subir facturas y tickets de forma rápida desde el móvil o desde el
            navegador.
          </li>
          <li>
            Usa IA para proponer proveedor, fecha, importe y categoría, que luego puedes revisar en el
            panel web.
          </li>
          <li>
            Agrupa automáticamente por periodos mensuales, lo que facilita preparar la información de
            cada trimestre.
          </li>
          <li>
            Desde el panel puedes enviar facturas concretas a tu gestoría por email cuando lo necesites.
          </li>
        </ul>
      </section>
    </>
  );
}

function EnviarFacturasGestoriaTrimestre() {
  return (
    <>
      <section className="space-y-3">
        <p>
          Para muchos autónomos, el peor momento del trimestre es el correo de la gestoría pidiendo
          "todas las facturas" con fecha límite. Si no tienes un sistema, eso significa horas buscando
          en el banco, en el correo y en cajas de tickets.
        </p>
        <p>
          Con un flujo sencillo y constante puedes llegar al cierre del trimestre con casi todo hecho,
          y que enviar la documentación sea solo cuestión de minutos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          1. Qué suele necesitar tu gestoría cada trimestre
        </h2>
        <p>Aunque cada asesoría tiene su forma de trabajar, lo habitual es que te pidan:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Facturas emitidas del trimestre (ventas y servicios).</li>
          <li>
            Facturas recibidas y tickets deducibles (gasolina, dietas, software, alquiler, etc.).
          </li>
          <li>
            Información sobre cobros y pagos relevantes (por ejemplo, si hay facturas impagadas).
          </li>
        </ul>
        <p>
          Cuanto más ordenada y completa esté esa información, menos tiempo perderás respondiendo
          correos de "me falta tal factura".
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          2. Flujo mínimo mensual para no llegar tarde
        </h2>
        <p>En lugar de dejarlo todo para el final del trimestre, puedes seguir este patrón mensual:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Durante el mes, ve subiendo facturas y tickets en cuanto los recibas.</li>
          <li>Al final de mes, revisa que no falten gastos importantes.</li>
          <li>
            Corrige categorías o conceptos si hace falta y marca lo que sabes que no es deducible.
          </li>
        </ol>
        <p>
          Si haces esto tres veces (un mes cada vez), cuando llegue el cierre del trimestre la mayor
          parte del trabajo ya estará hecha.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          3. Cómo preparar el envío del trimestre a tu gestoría
        </h2>
        <p>Cuando la gestoría te pida "las facturas del trimestre", puedes:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Comprobar que en tu sistema (carpetas o herramienta) están todas las facturas emitidas y
            recibidas del periodo.
          </li>
          <li>
            Agruparlas por meses dentro del trimestre (por ejemplo, enero, febrero y marzo).
          </li>
          <li>
            Enviarles un único correo por trimestre o compartir una carpeta organizada con todo.
          </li>
        </ol>
        <p>
          Si siempre sigues la misma estructura, tu gestoría sabrá dónde mirar y qué esperar cada
          trimestre.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
          4. Cómo te ayuda FaktuGo en este flujo
        </h2>
        <p>
          FaktuGo está pensado precisamente para que esa preparación trimestral sea mucho más ligera:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Te permite subir facturas y tickets durante el mes desde el móvil o desde el navegador,
            validando que sean documentos razonables mediante IA.
          </li>
          <li>
            Clasifica automáticamente por periodo mensual, de forma que puedes revisar mes a mes o por
            trimestres completos desde el panel.
          </li>
          <li>
            Puedes enviar facturas concretas a tu gestoría por email directamente desde el detalle de
            cada factura cuando necesites tratar algún caso particular.
          </li>
        </ul>
        <p>
          La idea es que, al llegar el cierre del trimestre, la mayor parte de tus facturas ya estén
          cargadas, clasificadas y listas para ser revisadas, en lugar de empezar a buscarlas desde
          cero.
        </p>
      </section>
    </>
  );
}
