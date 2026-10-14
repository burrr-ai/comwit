import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Transpile workspace sources: @comwit/ui-templates ships TSX while @comwit/ui ships dist.
  transpilePackages: ['@comwit/ui', '@comwit/ui-templates'],
}

export default nextConfig
