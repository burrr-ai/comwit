'use client'

import { usePathname } from 'next/navigation'
import { TableOfContents } from './toc'
import { SiteHeader } from '../../site-header'
import { MobileNavButton, MobileNavProvider } from './sidebar'

export function StateDocsFrame({
  children,
  navigation,
}: {
  children: React.ReactNode
  navigation: React.ReactNode
}) {
  const introduction = usePathname() === '/state/docs'
  return (
    <MobileNavProvider>
      <div className={`state-docs-frame ${introduction ? 'is-introduction' : ''}`}>
        <a href="#docs-content" className="skip-link">
          Skip to content
        </a>
        <div className="docs-header">
          <SiteHeader product="state" menu={<MobileNavButton />} />
        </div>
        <div className="docs-shell">
          {navigation}
          <div className={`docs-reading ${introduction ? 'docs-reading-intro' : ''}`}>
            <main id="docs-content" className="docs-main">
              <div>{children}</div>
            </main>
            {!introduction && (
              <aside className="docs-toc">
                <div>
                  <TableOfContents />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </MobileNavProvider>
  )
}
