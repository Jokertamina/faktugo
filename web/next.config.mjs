/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Permitimos importar codigo compartido desde ../packages
    externalDir: true,
  },
  // Indicamos a Next que debe transpilar y empaquetar el paquete local @faktugo/core
  transpilePackages: ["@faktugo/core"],
};

export default nextConfig;
