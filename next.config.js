/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    esmExternals: true,
  },
  // Configure webpack for Socket.IO and other modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    return config;
  },
  // Configure rewrites for Socket.IO if needed
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: '/socket.io/:path*',
      },
    ];
  },
};

module.exports = nextConfig;