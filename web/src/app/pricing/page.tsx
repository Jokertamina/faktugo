import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Planes y precios de FaktuGo",
  description:
    "Compara el plan gratuito y los planes de pago de FaktuGo para gestionar automáticamente tus facturas y tickets.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Planes y precios de FaktuGo",
    description:
      "Elige el plan de FaktuGo que mejor se adapte al volumen de facturas de tu negocio.",
    url: "https://faktugo.com/pricing",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
