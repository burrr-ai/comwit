import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import 'highlight.js/styles/github-dark.css'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'comwit — React state management for vibe coding',
  description:
    'LLM-optimized React state management library built for vibe coding with Claude Code. Proxy reactivity, built-in data fetching, and minimal token overhead. Just pass llms.txt.',
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
      'LLM-optimized React state management. Proxy reactivity, built-in data fetching, minimal token overhead. Just pass llms.txt to Claude Code.',
    siteName: 'comwit',
    url: 'https://library.comwit.io',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: "comwit — You don't need to read docs.",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'comwit — React state management for vibe coding',
    description:
      'LLM-optimized React state management. Proxy reactivity, built-in data fetching, minimal token overhead. Just pass llms.txt to Claude Code.',
    images: ['/og.png'],
  },
  other: {
    llmstxt: 'https://library.comwit.io/llms.txt',
  },
  metadataBase: new URL('https://library.comwit.io'),
  icons: {
    icon: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
