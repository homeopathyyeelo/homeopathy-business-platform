/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // Ensure proper charset
    config.output.charset = true;
    return config;
  },
  // Disable telemetry
  telemetry: false,
}

export default nextConfig
