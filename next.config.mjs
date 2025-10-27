/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/products/edit/:id',
        destination: '/products/:id/edit',
      },
    ];
  },
  // Enable proper error reporting
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        stream: false,
        util: false,
        os: false,
        child_process: false,
        'pg-native': false,
        'better-sqlite3': false,
      };
    }
    return config;
  },
}

export default nextConfig