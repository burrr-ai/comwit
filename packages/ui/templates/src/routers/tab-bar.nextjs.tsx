'use client'

/**
 * TabBar — Next.js App Router. `comwit-ui add app-shell` 이 next 를 감지하면 설치한다.
 *
 * 탭 목록을 BottomNav(플로팅 유리 캡슐)로 그린다. 현재 pathname 이 활성 탭이고, 탭은 <Link> 다.
 * 보통 TabShell(app-shell.tsx)이 그려 주므로 직접 쓸 일은 드물다. 모양은 bottom-nav.tsx 에서 고친다.
 *
 *   const APP_TABS: AppTab[] = [{ href: '/', label: 'Home', icon: House }, …]
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BottomNav, BottomNavItem } from '../components/ui/bottom-nav'

export type AppTab = {
  href: string
  label: string
  /** 아이콘 컴포넌트(lucide 등) 또는 엘리먼트. */
  icon: React.ComponentType<{ className?: string }> | React.ReactElement
}

type TabBarProps = Omit<React.ComponentProps<typeof BottomNav>, 'value' | 'children'> & {
  tabs: readonly AppTab[]
}

function TabBar({ tabs, ...props }: TabBarProps) {
  return (
    <React.Suspense fallback={<TabBarPlaceholder />}>
      <ActiveTabBar tabs={tabs} {...props} />
    </React.Suspense>
  )
}

/** URL 판독은 Suspense 잎 안에서만 — 정적 셸은 자리만 잡고 프리렌더된다. */
function ActiveTabBar({ tabs, showLabels = true, ...props }: TabBarProps) {
  const pathname = usePathname() ?? '/'
  return (
    <BottomNav value={pathname} showLabels={showLabels} {...props}>
      {tabs.map((tab) => (
        <BottomNavItem
          key={tab.href}
          value={tab.href}
          label={tab.label}
          icon={renderTabIcon(tab.icon)}
          asChild
        >
          <Link href={tab.href} />
        </BottomNavItem>
      ))}
    </BottomNav>
  )
}

/** 경로가 확정되기 전(정적 셸 프리렌더)에도 탭바 높이를 유지한다. */
function TabBarPlaceholder() {
  return (
    <div
      className="box-content h-14 shrink-0 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      aria-hidden="true"
    />
  )
}

function renderTabIcon(icon: AppTab['icon']) {
  return React.isValidElement(icon) ? icon : React.createElement(icon)
}

export { TabBar, TabBarPlaceholder, renderTabIcon }
