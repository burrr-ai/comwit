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
    'LLM-optimized React state management library built for vibe coding with Claude Code. Proxy reactivity, built-in data fetching, and minimal token overhead. Just pass llm.txt.',
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
      'LLM-optimized React state management. Proxy reactivity, built-in data fetching, minimal token overhead. Just pass llm.txt to Claude Code.',
    siteName: 'comwit',
    url: 'https://comwit.io',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'comwit — React state management for vibe coding',
    description:
      'LLM-optimized React state management. Proxy reactivity, built-in data fetching, minimal token overhead. Just pass llm.txt to Claude Code.',
  },
  other: {
    llmstxt: 'https://comwit.io/llm.txt',
  },
  metadataBase: new URL('https://comwit.io'),
  icons: {
    icon: '/favicon.ico',
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
