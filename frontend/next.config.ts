import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*', // Proxy to Backend
      },
      {
        source: '/auth/:path*',
        destination: 'http://backend:8000/auth/:path*', // Proxy Auth routes
      },
      {
        source: '/docs',
        destination: 'http://backend:8000/docs', // Proxy Swagger UI
      },
      {
        source: '/openapi.json',
        destination: 'http://backend:8000/openapi.json', // Proxy OpenAPI spec
      },
    ];
  },
};

export default nextConfig;
