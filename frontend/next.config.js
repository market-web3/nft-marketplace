/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['ipfs.io', 'gateway.ipfs.io', 'cloudflare-ipfs.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.nftstorage.link',
      },
    ],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
    GATEWAY_URL: process.env.GATEWAY_URL || 'ws://localhost:3001',
    TON_CONNECT_MANIFEST: process.env.TON_CONNECT_MANIFEST || 'https://your-domain.com/tonconnect-manifest.json',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
