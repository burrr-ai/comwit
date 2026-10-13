'use client'

/**
 * TabBar — Next.js App Router integration, installed when comwit-ui add app-shell detects next.
 *
 * Renders tabs with BottomNav, the floating glass capsule. The current pathname determines the active tab;
 * tabs use Link. Usually rendered by TabShell in app-shell.tsx, so direct use is rare. Edit bottom-nav.tsx for appearance.
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
  /** Icon component (such as from @comwit/ui/icons) or element. */
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

/** Read the URL only inside a Suspense leaf; the static shell reserves space and prerenders. */
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

/** Preserve tab-bar height before the path is resolved, including static shell prerendering. */
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
