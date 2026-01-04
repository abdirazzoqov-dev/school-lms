/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Optimize images
    images: {
      formats: ['image/webp', 'image/avif'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  }),
}

module.exports = nextConfig

