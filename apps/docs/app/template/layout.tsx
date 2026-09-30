import type { Metadata } from 'next'
import { Barlow_Condensed } from 'next/font/google'
import { SiteHeader } from '../site-header'
import { getTemplateDocs } from '@/lib/template-docs'
import { MobileNav, Sidebar } from './_components/sidebar'
import './template.css'

// Template 섹션의 제목 서체. 도면 표제란·공학 레터링(DIN 계열)의 좁은 그로테스크 — State(Manrope)·랜딩(Archivo)과 겹치지 않는다.
const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-template-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Comwit Template', template: '%s · Comwit Template' },
  description:
    'A Next.js template sliced by domain: four one-way layers, an .ai.md rulebook beside every layer, and one command to start.',
  other: { llmstxt: 'https://library.comwit.io/template/llms.txt' },
}

export default function TemplateLayout({ children }: { children: React.ReactNode }) {
  const docs = getTemplateDocs()
  return (
    <div className={`template-product antialiased ${display.variable}`}>
      <a href="#template-content" className="skip-link">
        Skip to content
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
