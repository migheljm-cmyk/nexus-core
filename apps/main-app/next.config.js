/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le enseña a Next.js a transpilar el código TypeScript/JSX de los paquetes locales del monorepo
  transpilePackages: [
    '@nexus/database',
    '@nexus/ai-engine',
    '@nexus-core/growth',
  ],
  experimental: {
    // Necesario para librerías de servidor como @react-pdf/renderer
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;