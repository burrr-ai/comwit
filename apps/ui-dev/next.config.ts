import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // 워크스페이스 소스(@comwit/ui-templates 는 .tsx 소스, @comwit/ui 는 dist)를 Next 가 트랜스파일
  transpilePackages: ['@comwit/ui', '@comwit/ui-templates'],
}

export default nextConfig
