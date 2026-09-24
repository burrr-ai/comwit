import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comwit State — One domain. One hook.',
  description: 'State, queries, and actions for React. One domain, one typed hook.',
  icons: { icon: '/panda-icon-32.png', apple: '/panda-apple-icon.png' },
  openGraph: {
    title: 'Comwit State',
    description: 'A little state. A lot of possibility.',
    images: ['/og/panda-garden'],
  },
  twitter: { card: 'summary_large_image', images: ['/og/panda-garden'] },
  other: { llmstxt: 'https://library.comwit.io/state/llms.txt' },
}

export default function StateLayout({ children }: { children: React.ReactNode }) {
  return <div className="state-product">{children}</div>
}
