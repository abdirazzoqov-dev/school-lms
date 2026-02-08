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
  
  // ✅ SECURITY: CORS and Security Headers
  async headers() {
    const securityHeaders = [
      // Content Security Policy - XSS protection
      {
        key: 'Content-Security-Policy',
        value: process.env.NODE_ENV === 'production'
          ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
          : "default-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
      },
      // Prevent clickjacking
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // Enable XSS filter
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // Referrer policy
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // Permissions policy
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      // HSTS (only in production)
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ]
        : []),
    ]

    return [
      // Apply security headers to all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // CORS for API routes
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || process.env.NEXTAUTH_URL || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ]
  },
  
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

