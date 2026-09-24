import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ['@comwit/ui', '@comwit/ui-templates'],
  async redirects() {
    return [
      { source: '/state', destination: '/state/docs', permanent: true },
      { source: '/docs/:path*', destination: '/state/docs/:path*', permanent: true },
      { source: '/llms.txt', destination: '/state/llms.txt', permanent: true },
      { source: '/llm/:path*', destination: '/state/llm/:path*', permanent: true },
      { source: '/components/:name', destination: '/ui/components#:name', permanent: true },
      { source: '/components', destination: '/ui/components', permanent: true },
      // 컴포넌트별 페이지 → 한 장짜리 갤러리의 앵커
      { source: '/ui/components/:name', destination: '/ui/components#:name', permanent: true },
      { source: '/ui/examples', destination: '/ui/components#forms', permanent: true },
      { source: '/tokens', destination: '/ui/theming', permanent: true },
      { source: '/og.png', destination: '/og/panda-garden', permanent: true },
    ]
  },
}
export default nextConfig
