import type { Metadata } from 'next'
import { SiteHeader } from '../site-header'
import { MobileNav, Sidebar } from './_components/sidebar'
import { Providers } from './providers'
import './ui.css'

export const metadata: Metadata = {
  title: { default: 'Comwit UI', template: '%s · Comwit UI' },
  description: 'Mobile-first React components you install as source and own.',
  other: { llmstxt: 'https://library.comwit.io/ui/llms.txt' },
}

export default function UiLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="ui-product font-sans antialiased">
        <a href="#ui-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader product="ui" menu={<MobileNav />} />
        <div className="ui-shell">
          <Sidebar />
          <main id="ui-content" className="ui-main">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
