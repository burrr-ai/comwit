import type { Metadata } from 'next'
import { SiteHeader } from '../site-header'
import { Sidebar } from './_components/sidebar'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: { default: 'Comwit UI', template: '%s · Comwit UI' },
  description: 'Headless behavior. UI components you can install, own, and customize.',
  other: { llmstxt: 'https://library.comwit.io/ui/llms.txt' },
}

export default function UiLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="ui-product">
        <a href="#ui-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <div className="ui-docs-shell">
          <Sidebar />
          <main id="ui-content" className="ui-docs-main">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
