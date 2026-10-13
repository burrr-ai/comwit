import { localizeMetadata } from '@/i18n/metadata'
import { getLocale } from 'next-intl/server'

import { Copy } from '@/i18n/copy'
import type { Metadata } from 'next'
import { Barlow_Condensed } from 'next/font/google'
import { SiteHeader } from '../site-header'
import { getTemplateDocs } from '@/lib/template-docs'
import { MobileNav, Sidebar } from './_components/sidebar'
import './template.css'

// Use a condensed DIN-style engineering typeface for Template headings, distinct from State's Manrope and the landing page's Archivo.
const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-template-display',
  display: 'swap',
})

const metadata: Metadata = {
  title: { default: 'Comwit Template', template: '%s · Comwit Template' },
  description:
    'A Next.js template sliced by domain: four one-way layers, an .ai.md rulebook beside every layer, and one command to start.',
  other: { llmstxt: 'https://library.comwit.io/template/llms.txt' },
}

export default async function TemplateLayout({ children }: { children: React.ReactNode }) {
  const docs = getTemplateDocs(await getLocale())
  return (
    <div className={`template-product antialiased ${display.variable}`}>
      <a href="#template-content" className="skip-link">
        <Copy id="text017" />{' '}
      </a>
      <SiteHeader product="template" menu={<MobileNav docs={docs} />} />
      <div className="template-shell">
        <Sidebar docs={docs} />
        <main id="template-content" className="template-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export async function generateMetadata() {
  return localizeMetadata(metadata)
}
