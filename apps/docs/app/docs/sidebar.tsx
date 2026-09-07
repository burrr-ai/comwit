'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { BookOpenTextIcon } from '@phosphor-icons/react/dist/csr/BookOpenText'
import { BracketsCurlyIcon } from '@phosphor-icons/react/dist/csr/BracketsCurly'
import { FileCodeIcon } from '@phosphor-icons/react/dist/csr/FileCode'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { XIcon } from '@phosphor-icons/react/dist/csr/X'
import { RobotIcon } from '@phosphor-icons/react/dist/csr/Robot'
import { CompassIcon } from '@phosphor-icons/react/dist/csr/Compass'
import type { DocMeta } from '@/lib/mdx'

type SidebarProps = { ungrouped: DocMeta[]; groups: Record<string, DocMeta[]> }

function hrefFor(doc: DocMeta) {
  return doc.slug === '' || doc.slug === 'index' ? '/docs' : `/docs/${doc.slug}`
}

function Navigation({ ungrouped, groups, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matches = (doc: DocMeta) =>
    terms.every((term) =>
      `${doc.title} ${doc.slug} ${doc.group || ''}`.toLowerCase().includes(term)
    )
  const intro = ungrouped.filter(matches)
  const sections = Object.entries(groups)
    .map(([title, docs]) => ({ title, docs: docs.filter(matches) }))
    .filter((section) => section.docs.length)
  const results = [...intro, ...sections.flatMap((section) => section.docs)]

  useEffect(() => {
    const area = scrollArea.current
    if (!area) return
    function revealCurrent() {
      if (!area || !area.clientHeight) return
      const current = area.querySelector('[aria-current="page"]')
      if (!current) return
      const containerBounds = area.getBoundingClientRect()
      const linkBounds = current.getBoundingClientRect()
      if (linkBounds.bottom > containerBounds.bottom)
        area.scrollTop += linkBounds.bottom - containerBounds.bottom + 8
      else if (linkBounds.top < containerBounds.top)
        area.scrollTop += linkBounds.top - containerBounds.top - 8
    }
    const resize = new ResizeObserver(revealCurrent)
    resize.observe(area)
    revealCurrent()
    return () => resize.disconnect()
  }, [pathname, query])

  function finishNavigation() {
    setQuery('')
    onNavigate?.()
  }

  function docLink(doc: DocMeta, featured = false) {
    const href = hrefFor(doc)
    const IntroIcon = doc.slug === 'llm-setup' ? RobotIcon : BookOpenTextIcon
    const codeLabel =
      doc.title.includes('()') || doc.title.startsWith('$') || doc.title === 'ComwitProvider'
    return (
      <Link
        key={doc.slug}
        href={href}
        aria-current={pathname === href ? 'page' : undefined}
        className={`${featured ? 'docs-link-featured' : ''} ${codeLabel ? 'docs-link-code' : ''}`}
        onClick={finishNavigation}
      >
        {featured && <IntroIcon size={19} weight="duotone" aria-hidden="true" />}
        <span>{doc.title}</span>
      </Link>
    )
  }

  return (
    <div className="docs-sidebar-content">
      <div className="sidebar-heading">
        <BookOpenTextIcon size={23} weight="duotone" aria-hidden="true" />
        <h2>Documentation</h2>
      </div>
      <div className="sidebar-search">
        <MagnifyingGlassIcon size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor={inputId}>
          Find a documentation page
        </label>
        <input
          ref={input}
          id={inputId}
          type="search"
          placeholder="Find a page…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setQuery('')
            }
            if (event.key === 'Enter' && results.length === 1) {
              event.preventDefault()
              router.push(hrefFor(results[0]))
              finishNavigation()
            }
          }}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear page search"
            onClick={() => {
              setQuery('')
              input.current?.focus()
            }}
          >
            <XIcon size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      <div ref={scrollArea} className="docs-nav-scroll">
        <nav className="docs-nav" aria-label="Documentation">
          {intro.length > 0 && (
            <div className="docs-nav-intro">{intro.map((doc) => docLink(doc, true))}</div>
          )}
          {sections.map(({ title, docs }) => {
            const SectionIcon = title === 'API' ? BracketsCurlyIcon : CompassIcon
            return (
              <section className="docs-nav-section" key={title}>
                <h3>
                  <SectionIcon size={18} weight="duotone" aria-hidden="true" />
                  {title}
                </h3>
                <div className="docs-nav-items">{docs.map((doc) => docLink(doc))}</div>
              </section>
            )
          })}
          {results.length === 0 && <p className="sidebar-empty">No pages found.</p>}
        </nav>
      </div>
      <span className="sr-only" role="status">
        {query ? `${results.length} documentation pages found` : ''}
      </span>
      <a className="sidebar-agent" href="/llms.txt">
        <FileCodeIcon size={21} weight="duotone" aria-hidden="true" />
        <strong>llms.txt</strong>
        <ArrowUpRightIcon size={17} aria-hidden="true" />
      </a>
    </div>
  )
}

export function DocsSidebar(props: SidebarProps) {
  const mobileMenu = useRef<HTMLDetailsElement>(null)
  return (
    <>
      <details className="docs-mobile-nav" ref={mobileMenu}>
        <summary>Browse documentation</summary>
        <Navigation
          {...props}
          onNavigate={() => {
            if (mobileMenu.current) mobileMenu.current.open = false
          }}
        />
      </details>
      <aside className="docs-sidebar">
        <div className="docs-sidebar-inner">
          <Navigation {...props} />
        </div>
      </aside>
    </>
  )
}
