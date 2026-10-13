'use client'

/**
 * TabBar — TanStack Router integration, installed when comwit-ui add app-shell detects @tanstack/react-router.
 *
 * Renders tabs with BottomNav, the floating glass capsule. The current pathname determines the active tab;
 * tabs use Link. Usually rendered by TabShell in app-shell.tsx, so direct use is rare. Edit bottom-nav.tsx for appearance.
 */

import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

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

function TabBar({ tabs, showLabels = true, ...props }: TabBarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
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
          <Link to={tab.href} />
        </BottomNavItem>
      ))}
    </BottomNav>
  )
}

function renderTabIcon(icon: AppTab['icon']) {
  return React.isValidElement(icon) ? icon : React.createElement(icon)
}

export { TabBar, renderTabIcon }
