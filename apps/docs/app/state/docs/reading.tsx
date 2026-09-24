'use client'

import { usePathname } from 'next/navigation'
import { TableOfContents } from './toc'

export function DocsReading({ children }: { children: React.ReactNode }) {
  const introduction = usePathname() === '/state/docs'
  return (
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
  )
}
