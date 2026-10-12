'use client'

import { Button } from '@comwit/ui-templates/button'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListIcon } from '@phosphor-icons/react/dist/csr/List'
import { XIcon } from '@phosphor-icons/react/dist/csr/X'
import type { TemplateDocMeta } from '@/lib/template-docs'

const OVERVIEW = '/template'
const hrefFor = (doc: TemplateDocMeta) => `/template/docs/${doc.slug}`

/** Groups in the order their first doc appears; docs keep their `order` inside a group. */
function groupDocs(docs: TemplateDocMeta[]) {
  const groups = new Map<string, TemplateDocMeta[]>()
  for (const doc of [...docs].sort((a, b) => a.order - b.order)) {
    const list = groups.get(doc.group)
    if (list) list.push(doc)
    else groups.set(doc.group, [doc])
  }
  return [...groups]
}

function NavContent({ docs, onNavigate }: { docs: TemplateDocMeta[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Template documentation" className="template-nav">
      <Link
        href={OVERVIEW}
        aria-current={pathname === OVERVIEW ? 'page' : undefined}
        onClick={onNavigate}
      >
        Overview
      </Link>
      {groupDocs(docs).map(([group, items]) => (
        <React.Fragment key={group}>
          <p className="template-nav-group">{group}</p>
          {items.map((doc) => {
            const href = hrefFor(doc)
            return (
              <Link
                key={doc.slug}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                onClick={onNavigate}
              >
                {doc.title}
              </Link>
            )
          })}
        </React.Fragment>
      ))}
      <p className="template-nav-group">For agents</p>
      <a href="/template/llms.txt" target="_blank" rel="noreferrer">
        llms.txt
      </a>
    </nav>
  )
}

export function Sidebar({ docs }: { docs: TemplateDocMeta[] }) {
  return (
    <aside className="template-sidebar">
      <NavContent docs={docs} />
    </aside>
  )
}

/** Narrow screens: the header's menu button opens the same navigation in a panel. */
export function MobileNav({ docs }: { docs: TemplateDocMeta[] }) {
  const [open, setOpen] = React.useState(false)
  // Close the panel after navigation; NavContent's links call onNavigate, so no effect is needed.
  return (
    <>
      <Button
        variant="plain"
        size="none"
        type="button"
        className="template-menu-button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <XIcon className="size-5" size={20} aria-hidden="true" />
        ) : (
          <ListIcon className="size-5" size={20} aria-hidden="true" />
        )}
      </Button>
      {open && (
        <div className="template-mobile-nav">
          <NavContent docs={docs} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
