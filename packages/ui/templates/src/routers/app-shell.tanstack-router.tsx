'use client'

/**
 * AppShell · TabShell — TanStack Router. `comwit-ui add app-shell` 이 @tanstack/react-router 를 감지하면 설치한다.
 *
 * 모바일 앱 껍데기 한 벌: 폰 틀 · 유일한 스크롤러 <main> · 당겨서 새로고침 · 앱바(reveal)와 탭바(compact)가 공유하는
 * 스크롤 의도 · 페이지 전환 · 뒤로가기 깊이. 동작은 전부 @comwit/ui(AppShell · NavDepth · ScrollChrome)에 있고 여기는
 * 조립과 모양만 갖는다 — 폭(max-w-md)·배경·스피너는 이 파일에서 고친다. 높이(dvh · 설치형 보정)는 globals.css 의
 * [data-slot=app-shell] 규칙이다.
 *
 *   // 루트 라우트 — 라우팅되는 영역(<Outlet />)을 한 번 감싼다
 *   <AppShell tabs={APP_TABS}><Outlet /></AppShell>
 *   // 탭 화면들의 레이아웃 라우트 — 본문만 바뀌고 탭바는 그대로 선다
 *   <TabShell><Outlet /></TabShell>
 *
 * 경계 정책 — 탭 경로(tabs 의 href)끼리는 바깥 경계의 key 를 공유해 탭바가 살아남고 본문만 가로 축으로 미끄러진다.
 * 그 밖(상세)은 경로마다 교체돼 drill 로 들어오며 탭바가 페이지와 함께 밀려난다. 전환 규칙은 기본 appTransitions —
 * 바꾸려면 transitions 를 준다.
 */

import * as React from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { AppShell as AppShellPrimitive, NavDepthProvider } from '@comwit/ui'

import { cn } from '../lib/utils'
import {
  PageTransition,
  appTransitions,
  type PageTransitionConfig,
} from '../components/ui/page-transition'
import { PullIndicator } from '../components/ui/pull-to-refresh'
import { RouteBoundary, type RouteLocation } from './route-boundary.tanstack-router'
import { TabBar, type AppTab } from './tab-bar.tanstack-router'

type AppShellProps = {
  /** 탭 목록 — 순서가 곧 탭바 순서이자 전환 방향. */
  tabs: readonly AppTab[]
  /** 전환 규칙. 기본은 appTransitions(탭 경로): 탭끼리 가로 축, 그 밖은 drill. 규칙 문법: https://ssgoi.dev/llms.txt */
  transitions?: PageTransitionConfig
  /** 스크롤러 위에 붙는 것(설치 배너 등). 있으면 상단 safe-area 는 이쪽이 갖는다. */
  top?: React.ReactNode
  /** 당겨서 새로고침. 없으면 제스처가 꺼진다. */
  onRefresh?: () => Promise<unknown> | void
  className?: string
  children: React.ReactNode
}

const AppShellContext = React.createContext<{ tabs: readonly AppTab[] }>({ tabs: [] })

function AppShell({ tabs, transitions, top, onRefresh, className, children }: AppShellProps) {
  const router = useRouter()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navRouter = React.useMemo(
    () => ({
      back: () => router.history.back(),
      replace: (href: string) => router.history.replace(href),
    }),
    [router]
  )
  const tabPaths = React.useMemo(() => tabs.map((tab) => tab.href), [tabs])
  const config = React.useMemo(
    () => transitions ?? appTransitions(tabPaths),
    [transitions, tabPaths]
  )
  const context = React.useMemo(() => ({ tabs }), [tabs])
  const resolve = React.useCallback(
    (location: RouteLocation) => resolveAppBoundary(location.pathname, tabPaths),
    [tabPaths]
  )

  return (
    <AppShellContext.Provider value={context}>
      <NavDepthProvider router={navRouter}>
        <div
          data-slot="app-shell"
          className={cn(
            'mx-auto flex w-full max-w-md flex-col overflow-hidden bg-background',
            className
          )}
        >
          {top != null ? (
            <div data-slot="app-shell-top" className="shrink-0">
              {top}
            </div>
          ) : null}
          {/* resetKey: 경로가 바뀌면 숨은 앱바·줄어든 탭바를 편다. */}
          <AppShellPrimitive.Root onRefresh={onRefresh} resetKey={pathname}>
            <PullIndicator />
            <AppShellPrimitive.Scroller>
              <PageTransition config={config} className="min-h-full">
                <RouteBoundary resolve={resolve} className="flex flex-col bg-background">
                  {children}
                </RouteBoundary>
              </PageTransition>
            </AppShellPrimitive.Scroller>
          </AppShellPrimitive.Root>
        </div>
      </NavDepthProvider>
    </AppShellContext.Provider>
  )
}

type TabShellProps = {
  className?: string
  children: React.ReactNode
}

/** 탭 화면의 셸 — 본문 경계만 교체되고 탭바는 그대로 선다. 탭들의 레이아웃 라우트에 둔다. */
function TabShell({ className, children }: TabShellProps) {
  const { tabs } = React.useContext(AppShellContext)
  return (
    <>
      <RouteBoundary className={cn('flex min-h-0 flex-1 flex-col bg-background', className)}>
        {children}
      </RouteBoundary>
      <TabBar tabs={tabs} />
    </>
  )
}

/** 바깥 경계의 id(경로)와 key(DOM 수명) — 탭 경로끼리 key 를 공유해 탭바가 살아남는다. */
function resolveAppBoundary(pathname: string, tabPaths: readonly string[]) {
  return { id: pathname, key: tabPaths.includes(pathname) ? 'app-tabs' : pathname }
}

export { AppShell, TabShell, resolveAppBoundary }
export type { AppShellProps, TabShellProps }
