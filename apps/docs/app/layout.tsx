import type { Metadata } from 'next'
import { Inter, Geist_Mono, Manrope } from 'next/font/google'
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

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'comwit — React state management for vibe coding',
  description:
    'React state management for you and your coding agent. One llms.txt for models, actions, queries, and server hydration. Used by 1,000+ projects on comwit.io.',
  keywords: [
    'comwit',
    'react',
    'state management',
    'vibe coding',
    'claude code',
    'llm',
    'ai',
    'proxy',
    'reactivity',
    'zustand',
    'valtio',
    'tanstack query',
  ],
  openGraph: {
    title: 'comwit — React state management for vibe coding',
    description:
      'React state management for you and your coding agent. One llms.txt. Then get back to making things.',
    siteName: 'comwit',
    url: 'https://library.comwit.io',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og/panda-garden',
        width: 1200,
        height: 630,
        alt: 'comwit — A little state. A lot of possibility. A panda coding in a purple garden.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'comwit — React state management for vibe coding',
    description:
      'React state management for you and your coding agent. One llms.txt. Then get back to making things.',
    images: ['/og/panda-garden'],
  },
  other: {
    llmstxt: 'https://library.comwit.io/llms.txt',
  },
  metadataBase: new URL('https://library.comwit.io'),
  icons: {
    icon: [
      { url: '/panda-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/panda-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/panda-apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} ${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
