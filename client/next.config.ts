import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore
  turbopack: {
    root: __dirname,
  },

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Security Headers
  async headers() {
    // Skip CSP entirely in development for easier debugging
    if (isDev) {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
          ]
        }
      ];
    }

    // Production CSP
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.jpsenterprises.in https://jps-test.onrender.com https://*.onrender.com https://*.netlify.app",
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              "frame-ancestors 'self'"
            ].join('; ')
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};

export default nextConfig;


