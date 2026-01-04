/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add headers for Content Security Policy
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allow unsafe-eval only in development (needed for Next.js hot reload)
            // In production, this should be removed for better security
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://js.stripe.com https://s3.tradingview.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://accounts.google.com https://www.googleapis.com https://api.coingecko.com https://config.ton.org https://s3.tradingview.com wss://bridge.tonapi.io wss://data.tradingview.com; frame-src https://js.stripe.com https://accounts.google.com https://s3.tradingview.com https://s.tradingview.com;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://js.stripe.com https://s3.tradingview.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://www.googleapis.com https://api.coingecko.com https://config.ton.org https://s3.tradingview.com wss://bridge.tonapi.io wss://data.tradingview.com; frame-src https://js.stripe.com https://accounts.google.com https://s3.tradingview.com https://s.tradingview.com;",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;

