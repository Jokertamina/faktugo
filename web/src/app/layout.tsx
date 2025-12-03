import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://faktugo.com";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FaktuGo",
  url: siteUrl,
  logo: `${siteUrl}/logo-faktugo.svg`,
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FaktuGo",
  url: siteUrl,
  inLanguage: "es-ES",
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FaktuGo",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Android, iOS, Web",
  url: siteUrl,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FaktuGo — App de facturas para autónomos y empresas",
    template: "%s | FaktuGo",
  },
  description:
    "FaktuGo es la app de facturas para autónomos y empresas que automatiza el escaneado, clasificación y organización de facturas desde el móvil y el navegador.",
  openGraph: {
    type: "website",
    siteName: "FaktuGo",
    locale: "es_ES",
    images: [
      {
        url: "/logo-faktugo-mark.svg",
        width: 1200,
        height: 630,
        alt: "FaktuGo — App de facturas para autónomos y empresas",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-[#050816] text-slate-50 flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <CookieBanner />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              organizationJsonLd,
              webSiteJsonLd,
              softwareJsonLd,
            ]),
          }}
        />
      </body>
    </html>
  );
}
