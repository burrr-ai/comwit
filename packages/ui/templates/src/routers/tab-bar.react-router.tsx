'use client'

/**
 * TabBar — React Router. `comwit-ui add app-shell` 이 react-router 를 감지하면 설치한다.
 *
 * 탭 목록을 BottomNav(플로팅 유리 캡슐)로 그린다. 현재 pathname 이 활성 탭이고, 탭은 <Link> 다.
 * 보통 TabShell(app-shell.tsx)이 그려 주므로 직접 쓸 일은 드물다. 모양은 bottom-nav.tsx 에서 고친다.
 */

import * as React from 'react'
import { Link, useLocation } from 'react-router'

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

function TabBar({ tabs, showLabels = true, ...props }: TabBarProps) {
  const { pathname } = useLocation()
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
