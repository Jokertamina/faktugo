import type { MetadataRoute } from "next";
import { guides } from "./guia/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://faktugo.com";
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
    },
    {
      url: `${baseUrl}/como-funciona`,
      lastModified,
    },
    {
      url: `${baseUrl}/app`,
      lastModified,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
    },
    {
      url: `${baseUrl}/legal/aviso-legal`,
      lastModified,
    },
    {
      url: `${baseUrl}/legal/terminos`,
      lastModified,
    },
    {
      url: `${baseUrl}/legal/privacidad`,
      lastModified,
    },
    {
      url: `${baseUrl}/legal/cookies`,
      lastModified,
    },
  ];

  const guideEntries: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${baseUrl}/guia/${guide.slug}`,
    lastModified,
  }));

  return [...staticEntries, ...guideEntries];
}
