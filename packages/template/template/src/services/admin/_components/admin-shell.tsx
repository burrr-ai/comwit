'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, type LucideIcon } from 'lucide-react'

import { ForesightLink as Link } from '@/lib/components/foresight-link'
import { Button } from '@/lib/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/lib/components/ui/sheet'
import { cn } from '@/lib/utils'

export type AdminNavItem = { label: string; href: string; icon: LucideIcon }
export type AdminNavGroup = { label: string; items: AdminNavItem[] }

type AdminShellProps = {
  /** 사이드바 상단 로고 슬롯 (브랜드 노드) */
  brand: React.ReactNode
  /** 논리 그룹으로 묶은 네비게이션 */
  navGroups: AdminNavGroup[]
  /** 로그아웃 핸들러 — 드로어는 셸이 먼저 닫는다 */
  onSignOut: () => void | Promise<void>
  signOutLabel?: string
  /** breadcrumb 루트 라벨 (기본 '어드민') */
  breadcrumbRoot?: string
  /** 정확 매칭으로 active 판정할 공개 관리자 루트 경로 */
  homeHref: string
  children: React.ReactNode
}

function isNavActive(href: string, pathname: string, homeHref: string) {
  return href === homeHref
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * 어드민 전체 셸 — 데스크톱 고정 사이드바 + 모바일 드로어(Sheet, 왼쪽) + 햄버거 헤더.
 * 반응형 chrome 전부를 흡수하고, 콘텐츠(navGroups/brand/onSignOut)는 prop으로만 주입한다.
 */
export function AdminShell({
  brand,
  navGroups,
  onSignOut,
  signOutLabel = '로그아웃',
  breadcrumbRoot = '어드민',
  homeHref,
  children,
}: AdminShellProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const sectionLabel =
    navGroups
      .flatMap((group) => group.items)
      .find((item) => isNavActive(item.href, pathname, homeHref))?.label ?? breadcrumbRoot

  async function handleSignOut() {
    setOpen(false)
    await onSignOut()
  }

  const sidebar = (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="pb-1">
            <p className="px-3 pt-3 pb-1 text-caption font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavActive(item.href, pathname, homeHref)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-control px-3 py-2.5 text-label transition-colors duration-fast',
                      active
                        ? 'bg-primary-surface font-semibold text-primary-ink'
                        : 'font-medium text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <item.icon className="size-[18px]" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 px-3 text-muted-foreground"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          {signOutLabel}
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-dvh bg-background">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center px-5">{brand}</div>
        {sidebar}
      </aside>

      {/* 모바일 드로어 — 같은 내비를 왼쪽 시트로 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0 lg:hidden">
          <SheetHeader className="h-16 justify-center px-5">
            <SheetTitle asChild>
              <div>{brand}</div>
            </SheetTitle>
            <SheetDescription className="sr-only">관리자 메뉴</SheetDescription>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* 메인 칼럼 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <nav className="flex items-center gap-1.5 text-label" aria-label="현재 위치">
            <span className="text-muted-foreground">{breadcrumbRoot}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground">{sectionLabel}</span>
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
