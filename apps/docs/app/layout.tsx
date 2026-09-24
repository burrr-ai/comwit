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
  icons: { icon: '/logo.svg' },
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
