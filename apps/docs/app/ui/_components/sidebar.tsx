'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { InputGroup, InputAddon } from '@comwit/ui-templates/input-group'
import { Input } from '@comwit/ui-templates/input'
import { Button } from '@comwit/ui-templates/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@comwit/ui-templates/sheet'
import { cn } from '@comwit/ui-templates/lib/utils'
import { byName, groups } from '../_generated/catalog'
import { uiVersion } from '@/lib/products'

const GALLERY = '/ui/components'
const guides = [
  { href: '/ui', label: 'Overview' },
  { href: '/ui/docs/installation', label: 'Installation' },
  { href: '/ui/theming', label: 'Tokens and theming' },
  { href: '/ui/docs/primitives', label: 'Headless primitives' },
]

/** 갤러리 페이지에서 지금 읽고 있는 항목 — 판정선(화면 위 35%)을 지난 마지막 항목. */
function useActiveItem(enabled: boolean) {
  const [active, setActive] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!enabled) return
    let frame = 0
    const measure = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      let current: string | null = null
      for (const node of document.querySelectorAll<HTMLElement>('[data-gallery-item]')) {
        if (node.getBoundingClientRect().top <= line) current = node.id
        else break
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])
  return enabled ? active : null
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
  /** 시트 안 — 우상단 닫기 버튼 자리를 비운다 */
  inSheet?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const onGallery = pathname === GALLERY
  const active = useActiveItem(onGallery)
  const [query, setQuery] = React.useState('')
  const listRef = React.useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const matches = (name: string) => {
    const c = byName[name]
    return !q || `${c.title} ${c.name} ${c.summary}`.toLowerCase().includes(q)
  }
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter(matches) }))
    .filter((g) => g.items.length)

  // 강조된 항목을 사이드바 스크롤 안에서만 보이게 한다(페이지 스크롤은 건드리지 않는다).
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

  return (
    <div className="flex h-full flex-col">
      <div className={cn('px-5 pt-6 pb-4', inSheet && 'pr-14')}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const first = visibleGroups[0]?.items[0]
            if (first) {
              router.push(hrefOf(first))
              onNavigate?.()
            }
          }}
        >
          <InputGroup className="bg-background">
            <InputAddon className="pr-0">
              <Search />
            </InputAddon>
            <Input
              ref={searchRef}
              type="search"
              aria-label="Find a component"
              placeholder="Find a component"
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
          <nav aria-label="Guides" className="mb-6">
            <p className="px-2 pb-1.5 text-caption font-semibold text-muted-foreground">
              Get started
            </p>
            {guides.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                onClick={onNavigate}
                aria-current={pathname === g.href ? 'page' : undefined}
                className="flex h-8 items-center rounded-lg px-2 text-body-sm font-medium text-soft-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground aria-[current=page]:bg-primary-surface aria-[current=page]:text-primary-ink"
              >
                {g.label}
              </Link>
            ))}
          </nav>
        )}

        <nav aria-label="Components">
          <Link
            href={GALLERY}
            onClick={onNavigate}
            aria-current={onGallery && !active ? 'page' : undefined}
            className="flex h-8 items-center justify-between rounded-lg px-2 text-caption font-semibold text-muted-foreground transition-colors duration-fast hover:text-foreground"
          >
            Components
            <span className="tabular-nums">{Object.keys(byName).length}</span>
          </Link>
          {visibleGroups.map((g) => (
            <div key={g.id} className="mt-3">
              <Link
                href={`${GALLERY}#${g.id}`}
                onClick={onNavigate}
                className="flex h-8 items-center rounded-lg px-2 text-body-sm font-semibold text-foreground transition-colors duration-fast hover:bg-accent"
              >
                {g.title}
              </Link>
              <ul className="ml-3 border-l border-border">
                {g.items.map((name) => {
                  const isActive = active === name
                  return (
                    <li key={name}>
                      <Link
                        href={hrefOf(name)}
                        data-nav={name}
                        onClick={onNavigate}
                        aria-current={isActive ? 'location' : undefined}
                        className={cn(
                          '-ml-px flex h-8 items-center border-l-2 border-transparent pl-3 text-body-sm transition-colors duration-fast',
                          isActive
                            ? 'border-primary font-semibold text-primary'
                            : 'text-soft-foreground hover:border-border-strong hover:text-foreground'
                        )}
                      >
                        {byName[name].title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {!visibleGroups.length && (
            <p className="px-2 py-6 text-body-sm text-muted-foreground">
              Nothing matches “{query}”.
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
    <aside className="ui-sidebar" aria-label="UI documentation">
      <NavContent searchRef={searchRef} autoScroll />
    </aside>
  )
}

/** 좁은 화면 — 상단 바의 버튼이 같은 내비를 왼쪽 시트로 연다. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const current =
    pathname === GALLERY
      ? 'Components'
      : (guides.find((g) => g.href === pathname)?.label ?? 'Comwit UI')
  return (
    <div className="ui-mobile-bar">
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Menu /> {current}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[88%] max-w-xs gap-0 p-0"
          // 검색창에 바로 포커스하면 폰 키보드가 튀어나온다 — 시트 자체에 둔다.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
        >
          <SheetTitle className="sr-only">Comwit UI</SheetTitle>
          <SheetDescription className="sr-only">Guides and components</SheetDescription>
          <NavContent onNavigate={() => setOpen(false)} inSheet />
        </SheetContent>
      </Sheet>
    </div>
  )
}
