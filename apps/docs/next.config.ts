import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/og.png', destination: '/og/panda-garden', permanent: true }]
  },
}

export default nextConfig
