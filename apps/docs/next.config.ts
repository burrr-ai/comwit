import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@comwit/ui', '@comwit/ui-templates'],
  async redirects() {
    return [
      { source: '/docs/:path*', destination: '/state/docs/:path*', permanent: true },
      { source: '/llms.txt', destination: '/state/llms.txt', permanent: true },
      { source: '/llm/:path*', destination: '/state/llm/:path*', permanent: true },
      { source: '/components/:path*', destination: '/ui/components/:path*', permanent: true },
      { source: '/tokens', destination: '/ui/theming', permanent: true },
      { source: '/og.png', destination: '/og/panda-garden', permanent: true },
    ]
  },
}
export default nextConfig
