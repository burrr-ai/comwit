import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static shells with request-time Suspense boundaries, as in Comwit's production app.
  cacheComponents: true,
}

export default nextConfig
