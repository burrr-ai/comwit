'use client'

/**
 * TabBar — 라우터를 감지하지 못했을 때 설치되는 기본 구현.
 *
 * 탭 목록을 BottomNav(플로팅 유리 캡슐)로 그린다. 현재 경로(value)를 직접 주고, 탭은 <a href> 다 —
 * onNavigate 를 주면 전체 로드 대신 그쪽으로 넘긴다(라우터의 push, 데모의 setState).
 * 보통 TabShell(app-shell.tsx)이 그려 주므로 직접 쓸 일은 드물다. 모양은 bottom-nav.tsx 에서 고친다.
 *
 * 지원 라우터(next · react-router · @tanstack/react-router)는 `comwit-ui add app-shell --router <name>` 으로
 * 완성된 구현을 다시 받을 수 있다.
 */

import * as React from 'react'

import { BottomNav, BottomNavItem } from '../components/ui/bottom-nav'

export type AppTab = {
  href: string
  label: string
  /** 아이콘 컴포넌트(lucide 등) 또는 엘리먼트. */
  icon: React.ComponentType<{ className?: string }> | React.ReactElement
}

type TabBarProps = Omit<React.ComponentProps<typeof BottomNav>, 'value' | 'children'> & {
  tabs: readonly AppTab[]
  /** 현재 경로. */
  value: string
  /** 탭을 누르면 여기로 넘긴다. 없으면 <a href> 가 그대로 이동한다(전체 로드). */
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
