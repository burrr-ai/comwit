'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { DocMeta } from '@/lib/mdx'

export function DocsSidebar({
  ungrouped,
  groups,
}: {
  ungrouped: DocMeta[]
  groups: Record<string, DocMeta[]>
}) {
  const [open, setOpen] = useState(false)

  const navContent = (
    <>
      <Link href="/" className="block font-serif text-lg tracking-[0.15em] text-foreground mb-6">
        mucha
      </Link>

      <div className="ornament w-full mb-6">
        <span />
      </div>

      <nav className="space-y-5">
        {ungrouped.map((doc) => (
          <Link
            key={doc.slug}
            href={doc.slug === '' || doc.slug === 'index' ? '/docs' : `/docs/${doc.slug}`}
            onClick={() => setOpen(false)}
            className="block font-serif text-[13px] tracking-wide text-foreground/60 hover:text-gold-dark transition-colors"
          >
            {doc.title}
          </Link>
        ))}
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <h3 className="font-serif text-[10px] uppercase tracking-[0.25em] text-gold-dark/70 mb-2">
              {group}
            </h3>
            <div className="space-y-1 ml-1 border-l border-gold/20 pl-3">
              {items.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  onClick={() => setOpen(false)}
                  className="block font-serif text-[13px] tracking-wide text-foreground/60 hover:text-gold-dark transition-colors py-0.5"
                >
                  {doc.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="ornament w-full mt-6">
        <span />
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden w-9 h-9 flex items-center justify-center rounded border border-gold/40 bg-cream-light/90 text-foreground/60 backdrop-blur-sm"
        aria-label="Toggle sidebar"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          {open ? (
            <>
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </>
          ) : (
            <>
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-56 border-r border-gold/30 p-5 pt-14
          overflow-y-auto transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:hidden
        `}
        style={{
          backgroundColor: 'var(--cream-light)',
          backgroundImage: 'url(/mucha/the-seasons-spring.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'soft-light',
        }}
      >
        <div className="relative z-10">{navContent}</div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:block w-56 shrink-0 border-r border-gold/30"
        style={{
          backgroundColor: 'var(--cream-light)',
          backgroundImage: 'url(/mucha/the-seasons-spring.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'soft-light',
        }}
      >
        <div className="sticky top-0 h-screen overflow-y-auto p-5">{navContent}</div>
      </aside>
    </>
  )
}
