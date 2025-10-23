#!/bin/bash

echo "============================================"
echo "FINAL COMPREHENSIVE FIX"
echo "============================================"
echo ""

# 1. Stop everything
echo "1. Stopping all services..."
./stop-complete.sh > /dev/null 2>&1

# 2. Clean everything
echo "2. Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# 3. Verify all source files are clean
echo "3. Verifying source files..."
python3 verify-all-clean.py

# 4. Disable Next.js telemetry and optimize config
echo "4. Optimizing Next.js config..."
cat > next.config.mjs << 'EOF'
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
EOF

# 5. Start services
echo "5. Starting services..."
./start-complete.sh

echo ""
echo "============================================"
echo "DONE! Now test in browser:"
echo "1. Open INCOGNITO: Ctrl + Shift + N"
echo "2. Go to: http://localhost:3000/dashboard"
echo "3. Press F12 and check console"
echo "============================================"
