'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'
import type { DocMeta } from '@/lib/mdx'

export function DocsSidebar({
  ungrouped,
  groups,
}: {
  ungrouped: DocMeta[]
  groups: Record<string, DocMeta[]>
}) {
  const pathname = usePathname()
  const mobileMenu = useRef<HTMLDetailsElement>(null)
  function docLink(doc: DocMeta) {
    const href = doc.slug === '' || doc.slug === 'index' ? '/docs' : `/docs/${doc.slug}`
    return (
      <Link
        key={doc.slug}
        href={href}
        aria-current={pathname === href ? 'page' : undefined}
        onClick={() => {
          if (mobileMenu.current) mobileMenu.current.open = false
        }}
      >
        {doc.title}
      </Link>
    )
  }
  const content = (
    <nav className="docs-nav" aria-label="Documentation">
      <div>
        <h3>Start here</h3>
        {ungrouped.map(docLink)}
      </div>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <h3>{group}</h3>
          {items.map(docLink)}
        </div>
      ))}
    </nav>
  )

  return (
    <>
      <details className="docs-mobile-nav" ref={mobileMenu}>
        <summary>Browse documentation</summary>
        {content}
      </details>
      <aside className="docs-sidebar">
        <div className="docs-sidebar-inner">
          {content}
          <a className="sidebar-agent" href="/llms.txt">
            <strong>llms.txt</strong>
          </a>
        </div>
      </aside>
    </>
  )
}
