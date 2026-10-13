'use client'

/**
 * TabBar — default implementation installed when no router is detected.
 *
 * Renders tabs with BottomNav, the floating glass capsule. Supply the current path as value. Tabs use a href;
 * providing onNavigate delegates navigation (router push or demo setState) instead of loading the whole page.
 * Usually rendered by TabShell in app-shell.tsx, so direct use is rare. Edit bottom-nav.tsx for appearance.
 *
 * For supported routers (next, react-router, @tanstack/react-router), reinstall the complete integration with
 * comwit-ui add app-shell --router <name>.
 */

import * as React from 'react'

import { BottomNav, BottomNavItem } from '../components/ui/bottom-nav'

export type AppTab = {
  href: string
  label: string
  /** Icon component (such as from @comwit/ui/icons) or element. */
  icon: React.ComponentType<{ className?: string }> | React.ReactElement
}

type TabBarProps = Omit<React.ComponentProps<typeof BottomNav>, 'value' | 'children'> & {
  tabs: readonly AppTab[]
  /** Current path. */
  value: string
  /** Called when a tab is pressed. Without it, a href navigates normally with a full page load. */
  onNavigate?: (href: string) => void
}

function TabBar({ tabs, value, onNavigate, showLabels = true, ...props }: TabBarProps) {
  return (
    <BottomNav value={value} showLabels={showLabels} {...props}>
      {tabs.map((tab) => (
        <BottomNavItem
          key={tab.href}
          value={tab.href}
          label={tab.label}
          icon={renderTabIcon(tab.icon)}
          asChild
        >
          <a
            href={tab.href}
            onClick={(event) => {
              if (!onNavigate) return
              event.preventDefault()
              onNavigate(tab.href)
            }}
          />
        </BottomNavItem>
      ))}
    </BottomNav>
  )
}

function renderTabIcon(icon: AppTab['icon']) {
  return React.isValidElement(icon) ? icon : React.createElement(icon)
}

export { TabBar, renderTabIcon }
