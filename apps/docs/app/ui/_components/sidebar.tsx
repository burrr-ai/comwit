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
import { goToGalleryTarget } from './gallery-nav'

const GALLERY = '/ui/components'
const guides = [
  { href: '/ui', label: 'Overview' },
  { href: '/ui/docs/installation', label: 'Installation' },
  { href: '/ui/theming', label: 'Tokens and theming' },
  { href: '/ui/docs/primitives', label: 'Headless primitives' },
]

/**
 * 갤러리 페이지에서 지금 읽고 있는 항목 — 헤더 바로 아래 판정선을 지난 마지막 항목.
 * 사이드바에서 고른 항목은 그리로 가는 스크롤이 멈출 때까지 붙잡아 둔다. 그래야 끝까지 못 올라가는
 * 마지막 항목들도 고른 대로 켜진다. 다음 스크롤부터 다시 위치로 판정한다.
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
      // html 의 scroll-padding-top 이 곧 "헤더 바로 아래" — 앵커로 올라온 항목이 그 선에 선다.
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
      release() // 이미 제자리라 스크롤이 일어나지 않아도 풀린다
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
  /** 시트 안 — 우상단 닫기 버튼 자리를 비운다 */
  inSheet?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const onGallery = pathname === GALLERY
  const [active, holdActive] = useActiveItem(onGallery)
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

  /**
   * 갤러리 위에서는 라우터를 거치지 않고 바로 스크롤한다. 시트 안에서 눌렀다면 시트가 닫혀
   * 스크롤 잠금이 풀린 다음 움직인다. 새 탭 열기(⌘·Ctrl·가운데 클릭)는 링크 그대로 둔다.
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
          <nav aria-label="Guides" className="mb-5 border-b border-border pb-5">
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
          {visibleGroups.map((g) => (
            <div key={g.id} className="mt-3 first:mt-0">
              <Link
                href={`${GALLERY}#${g.id}`}
                onClick={onAnchorClick(g.id, g.items[0])}
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
                        onClick={onAnchorClick(name, name)}
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

/** 좁은 화면 — 헤더의 메뉴 버튼이 같은 내비를 왼쪽 시트로 연다. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="ui-menu-button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
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
    </>
  )
}
