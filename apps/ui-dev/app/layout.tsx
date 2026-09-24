import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Noto_Sans_KR, Noto_Sans_Mono } from 'next/font/google'

import './globals.css'
import { Providers } from './providers'

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
})

const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
})

const notoSansMono = Noto_Sans_Mono({
  variable: '--font-noto-sans-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Comwit UI — Catalog',
  description: '@comwit/ui + @comwit/ui-templates 컴포넌트 카탈로그',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body
        className={`${pretendard.variable} ${notoSansKr.variable} ${notoSansMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
