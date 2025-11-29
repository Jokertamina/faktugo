/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Permitimos importar codigo compartido desde ../packages
    externalDir: true,
    // Desactivamos Lightning CSS en el build (fallback a PostCSS) para evitar
    // errores de modulo nativo en entornos como Vercel.
    useLightningcss: false,
  },
  // Indicamos a Next que debe transpilar y empaquetar el paquete local @faktugo/core
  transpilePackages: ["@faktugo/core"],
};

export default nextConfig;
