import { localizeMetadata } from '@/i18n/metadata'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
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

// Set --font-pretendard on html so the library's --font-sans token resolves at :root.
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

const metadata: Metadata = {
  title: 'Comwit — State, UI & Template',
  description: 'React state, UI components, and a Next.js starter. The tools behind comwit.io.',
  metadataBase: new URL('https://library.comwit.io'),
  openGraph: {
    title: 'Comwit — State, UI & Template',
    description: 'State, UI, and a full-stack starter for your next app.',
    siteName: 'Comwit',
    type: 'website',
    images: ['/og/libraries'],
  },
  twitter: { card: 'summary_large_image', images: ['/og/libraries'] },
  other: { llmstxt: 'https://library.comwit.io/llms.txt' },
  // Generate raster icons from public/icon.svg with scripts/gen-icons.mjs. Declare the ICO size as 32px
  // so Chrome selects SVG instead. The State layout overrides this with its panda icon.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={pretendard.variable}>
      <body className={`${inter.variable} ${geistMono.variable} ${manrope.variable} antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}

export async function generateMetadata() {
  return localizeMetadata(metadata)
}
