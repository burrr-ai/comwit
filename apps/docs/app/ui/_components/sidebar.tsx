'use client'

import { Copy, useCopy } from '@/i18n/copy'
import { useTranslations } from 'next-intl'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MenuIcon, SearchIcon } from '@comwit/ui/icons'
import { InputGroup, InputAddon } from '@comwit/ui-templates/input-group'
import { Input } from '@comwit/ui-templates/input'
import { Button } from '@comwit/ui-templates/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@comwit/ui-templates/sheet'
import { cn } from '@comwit/ui-templates/lib/utils'
import { byName, groups } from '../_generated/catalog'
import { uiVersion } from '@/lib/products'
import { goToGalleryTarget } from './gallery-nav'

const GALLERY = '/ui/components'
const guides = [
  { href: '/ui', label: 'Overview' },
  { href: '/ui/docs/installation', label: 'Installation' },
  { href: '/ui/icons', label: 'Icons' },
  { href: '/ui/theming', label: 'Tokens and theming' },
  { href: '/ui/docs/primitives', label: 'Headless primitives' },
]

/**
 * Track the last gallery item above the header's bottom edge. Keep a sidebar selection active until its scroll ends, including final items that cannot reach the top; resume position tracking on the next scroll.
 */
function useActiveItem(enabled: boolean) {
  const [active, setActive] = React.useState<string | null>(null)
  const held = React.useRef(false)
  const settle = React.useRef(0)

  const release = React.useCallback(() => {
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => (held.current = false), 160)
  }, [])

  React.useEffect(() => {
    if (!enabled) return
    let frame = 0
    const measure = () => {
      frame = 0
      // html scroll-padding-top marks the line just below the header where anchor targets land.
      const line = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 48
      let current: string | null = null
      for (const node of document.querySelectorAll<HTMLElement>('[data-gallery-item]')) {
        if (node.getBoundingClientRect().top <= line) current = node.id
        else break
      }
      setActive(current)
    }
    const onScroll = () => {
      if (held.current) return release()
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.clearTimeout(settle.current)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled, release])

  const hold = React.useCallback(
    (id: string) => {
      held.current = true
      setActive(id)
      release() // Release even when no scroll occurs because the item is already in place.
    },
    [release]
  )

  return [enabled ? active : null, hold] as const
}

function NavContent({
  onNavigate,
  searchRef,
  autoScroll,
  inSheet,
}: {
  onNavigate?: () => void
  searchRef?: React.Ref<HTMLInputElement>
  autoScroll?: boolean
  /** Reserve space for the sheet's top-right close button. */
  inSheet?: boolean
}) {
  const copy = useTranslations('Copy')

  const pathname = usePathname()
  const router = useRouter()
  const onGallery = pathname === GALLERY
  const [active, holdActive] = useActiveItem(onGallery)
  const [query, setQuery] = React.useState('')
  const listRef = React.useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const localize = useCopy()
  const matches = (name: string) => {
    const c = byName[name]
    return (
      !q ||
      `${c.title} ${c.name} ${c.summary} ${localize(c.title)} ${localize(c.summary)}`
        .toLowerCase()
        .includes(q)
    )
  }
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter(matches) }))
    .filter((g) => g.items.length)

  // Reveal the active item within the sidebar scroller without moving the page.
  React.useEffect(() => {
    if (!autoScroll || !active || !listRef.current) return
    const list = listRef.current
    const link = list.querySelector<HTMLElement>(`[data-nav="${active}"]`)
    if (!link) return
    const top = link.offsetTop - list.offsetTop
    if (top < list.scrollTop + 40 || top > list.scrollTop + list.clientHeight - 80)
      list.scrollTo({ top: top - list.clientHeight / 3, behavior: 'smooth' })
  }, [active, autoScroll])

  const hrefOf = (name: string) => `${GALLERY}#${name}`

  /**
   * Scroll directly on the gallery page. Inside a sheet, close it and release scroll lock first. Preserve native links for Cmd/Ctrl/middle-click navigation.
   */
  const goTo = (id: string, item?: string) => {
    if (item) holdActive(item)
    onNavigate?.()
    if (onNavigate) window.setTimeout(() => goToGalleryTarget(id), 320)
    else goToGalleryTarget(id)
  }
  const onAnchorClick = (id: string, item?: string) => (e: React.MouseEvent) => {
    if (!onGallery || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return onNavigate?.()
    e.preventDefault()
    goTo(id, item)
  }

  return (
    <div className="flex h-full flex-col">
      <div className={cn('px-5 pt-6 pb-4', inSheet && 'pr-14')}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const first = visibleGroups[0]?.items[0]
            if (!first) return
            if (onGallery) return goTo(first, first)
            router.push(hrefOf(first))
            onNavigate?.()
          }}
        >
          <InputGroup className="bg-background">
            <InputAddon className="pr-0">
              <SearchIcon />
            </InputAddon>
            <Input
              ref={searchRef}
              type="search"
              aria-label={copy('text156')}
              placeholder={copy('text156')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <InputAddon className="hidden pl-0 lg:flex">
              <kbd className="rounded-sm border border-border px-1.5 font-sans text-micro text-muted-foreground">
                ⌘K
              </kbd>
            </InputAddon>
          </InputGroup>
        </form>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-10">
        {!q && (
          <nav aria-label={copy('text102')} className="mb-5 border-b border-border pb-5">
            {guides.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                onClick={onNavigate}
                aria-current={pathname === g.href ? 'page' : undefined}
                className="flex h-8 items-center rounded-lg px-2 text-body-sm font-medium text-soft-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground aria-[current=page]:bg-primary-surface aria-[current=page]:text-primary-ink"
              >
                <Copy text={g.label} />
              </Link>
            ))}
          </nav>
        )}

        <nav aria-label={copy('text158')}>
          {visibleGroups.map((g) => (
            <div key={g.id} className="mt-3 first:mt-0">
              <Link
                href={`${GALLERY}#${g.id}`}
                onClick={onAnchorClick(g.id, g.items[0])}
                className="flex h-8 items-center rounded-lg px-2 text-body-sm font-semibold text-foreground transition-colors duration-fast hover:bg-accent"
              >
                <Copy text={g.title} />
              </Link>
              <ul className="ml-3 border-l border-border">
                {g.items.map((name) => {
                  const isActive = active === name
                  return (
                    <li key={name}>
                      <Link
                        href={hrefOf(name)}
                        data-nav={name}
                        onClick={onAnchorClick(name, name)}
                        aria-current={isActive ? 'location' : undefined}
                        className={cn(
                          '-ml-px flex h-8 items-center border-l-2 border-transparent pl-3 text-body-sm transition-colors duration-fast',
                          isActive
                            ? 'border-primary font-semibold text-primary'
                            : 'text-soft-foreground hover:border-border-strong hover:text-foreground'
                        )}
                      >
                        <Copy text={byName[name].title} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {!visibleGroups.length && (
            <p className="px-2 py-6 text-body-sm text-muted-foreground">
              <Copy id="text159" />
              {query}”.
            </p>
          )}
        </nav>

        {!q && (
          <div className="mt-8 flex items-center justify-between px-2 text-caption text-muted-foreground">
            <a
              href="/ui/llms.txt"
              className="font-medium transition-colors duration-fast hover:text-foreground"
            >
              llms.txt
            </a>
            <span className="tabular-nums">v{uiVersion}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  const copy = useTranslations('Copy')

  const searchRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <aside className="ui-sidebar" aria-label={copy('text161')}>
      <NavContent searchRef={searchRef} autoScroll />
    </aside>
  )
}

/** On narrow screens, the header menu opens the same navigation in a left sheet. */
export function MobileNav() {
  const copy = useTranslations('Copy')

  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="ui-menu-button"
        aria-label={copy('text162')}
        onClick={() => setOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          closeLabel={copy('closeOverlay')}
          side="left"
          className="w-[88%] max-w-xs gap-0 p-0"
          // Focus the sheet instead of the search input to avoid opening the mobile keyboard.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
        >
          <SheetTitle className="sr-only">Comwit UI</SheetTitle>
          <SheetDescription className="sr-only">
            <Copy id="text163" />
          </SheetDescription>
          <NavContent onNavigate={() => setOpen(false)} inSheet />
        </SheetContent>
      </Sheet>
    </>
  )
}
