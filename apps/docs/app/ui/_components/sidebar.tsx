'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { components } from '../_generated/catalog'
import { uiVersion } from '@/lib/products'

const sorted = [...components].sort((a, b) => a.title.localeCompare(b.title))
const guides = [
  { href: '/ui', label: 'Overview' },
  { href: '/ui/docs/installation', label: 'Installation' },
  { href: '/ui/components', label: 'Components' },
  { href: '/ui/examples', label: 'Examples' },
  { href: '/ui/theming', label: 'Tokens & theming' },
  { href: '/ui/docs/primitives', label: 'Headless primitives' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const visible = sorted.filter((c) =>
    `${c.name} ${c.title}`.toLowerCase().includes(query.toLowerCase())
  )
  function item(href: string, label: string) {
    return (
      <Link
        key={href}
        href={href}
        aria-current={pathname === href ? 'page' : undefined}
        onClick={() => setOpen(false)}
      >
        {label}
      </Link>
    )
  }
  return (
    <aside className="ui-sidebar">
      <button
        className="ui-mobile-menu"
        aria-expanded={open}
        aria-controls="ui-navigation"
        onClick={() => setOpen(!open)}
      >
        UI documentation <span>{open ? '−' : '+'}</span>
      </button>
      <div id="ui-navigation" className={`ui-sidebar-content ${open ? 'is-open' : ''}`}>
        <p className="ui-sidebar-title">
          Comwit UI <span>{uiVersion}</span>
        </p>
        <nav aria-label="UI guides">{guides.map((g) => item(g.href, g.label))}</nav>
        <label className="sr-only" htmlFor="ui-search">
          Find a component
        </label>
        <input
          id="ui-search"
          type="search"
          placeholder="Find a component…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <nav aria-label="UI components">
          {visible.map((c) => item(`/ui/components/${c.name}`, c.title))}
          {!visible.length && <p className="ui-no-results">No components found.</p>}
        </nav>
        <a className="ui-agent-link" href="/ui/llms.txt">
          llms.txt ↗
        </a>
      </div>
    </aside>
  )
}
