import type { Metadata } from 'next'
import { Inter, Geist_Mono, Manrope } from 'next/font/google'
import localFont from 'next/font/local'
import 'highlight.js/styles/github-dark.css'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
})

// UI 라이브러리 기본 서체 — --font-pretendard 를 <html> 에 두어 토큰의 --font-sans 가 :root 에서 풀린다.
const pretendard = localFont({
  src: '../../ui-dev/app/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Comwit — State & UI',
  description: 'The open-source State and UI libraries behind comwit.io templates.',
  metadataBase: new URL('https://library.comwit.io'),
  openGraph: {
    title: 'Comwit — State & UI',
    description: 'The building blocks behind comwit.io.',
    siteName: 'Comwit',
    type: 'website',
    images: ['/og/libraries'],
  },
  twitter: { card: 'summary_large_image', images: ['/og/libraries'] },
  // 마크는 public/icon.svg 하나 — 래스터는 scripts/gen-icons.mjs 가 뽑는다. ico 의 sizes 를 32 로 적어야
  // 크롬이 ico 대신 SVG 를 고른다. State 는 판다 아이콘으로 덮어쓴다(state/layout.tsx).
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={pretendard.variable}>
      <body className={`${inter.variable} ${geistMono.variable} ${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
