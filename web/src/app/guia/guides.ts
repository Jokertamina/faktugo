export type GuideMeta = {
  slug: string;
  title: string;
  description: string;
  readingTimeMinutes: number;
  keywords: string[];
};

export const guides: GuideMeta[] = [
  {
    slug: "como-organizar-facturas-autonomo",
    title: "Cómo organizar las facturas de tu negocio sin volverte loco",
    description:
      "Guía práctica para autónomos y pequeñas empresas sobre cómo estructurar, nombrar y archivar facturas y tickets sin perder tiempo.",
    readingTimeMinutes: 10,
    keywords: [
      "organizar facturas autonomo",
      "ordenar facturas",
      "archivar facturas digitalmente",
      "gestionar tickets y facturas",
    ],
  },
  {
    slug: "guardar-tickets-facturas-hacienda",
    title: "Cómo guardar tickets y facturas para Hacienda sin volverte loco",
    description:
      "Qué documentos hay que conservar, durante cuánto tiempo y cómo guardarlos para que una revisión de Hacienda no te pille por sorpresa.",
    readingTimeMinutes: 9,
    keywords: [
      "guardar tickets y facturas",
      "facturas hacienda autonomo",
      "conservar facturas",
      "obligaciones facturacion",
    ],
  },
  {
    slug: "obligaciones-facturacion-autonomo-espana",
    title: "Obligaciones básicas de facturación para autónomos en España",
    description:
      "Resumen práctico de qué facturas tienes que emitir, qué datos deben incluir y qué libros de ingresos y gastos conviene llevar al día.",
    readingTimeMinutes: 11,
    keywords: [
      "obligaciones facturacion autonomo",
      "facturas autonomo españa",
      "libro ingresos gastos",
      "requisitos factura",
    ],
  },
  {
    slug: "enviar-facturas-gestoria-trimestre",
    title: "Cómo enviar tus facturas a la gestoría cada trimestre sin agobios",
    description:
      "Flujo práctico para preparar y enviar toda la documentación a tu gestoría de forma ordenada cada trimestre, sin persecuciones de última hora.",
    readingTimeMinutes: 8,
    keywords: [
      "enviar facturas gestoria",
      "facturas trimestre autonomo",
      "preparar documentacion gestoria",
      "organizar facturas clientes",
    ],
  },
];

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return guides.find((g) => g.slug === slug);
}
