'use client'

/**
 * AppShell · TabShell — 라우터를 감지하지 못했을 때 설치되는 기본 구현. 현재 경로(path)를 직접 준다.
 *
 * 모바일 앱 껍데기 한 벌: 폰 틀 · 유일한 스크롤러 <main> · 당겨서 새로고침 · 앱바(reveal)와 탭바(compact)가 공유하는
 * 스크롤 의도 · 페이지 전환 · 뒤로가기 깊이. 동작은 전부 @comwit/ui(AppShell · NavDepth · ScrollChrome)에 있고 여기는
 * 조립과 모양만 갖는다 — 폭(max-w-md)·배경·스피너는 이 파일에서 고친다. 높이(dvh · 설치형 보정)는 globals.css 의
 * [data-slot=app-shell] 규칙이다.
 *
 *   const [path, setPath] = useState('/')          // 실제 앱에서는 라우터의 pathname 과 push
 *   <AppShell tabs={TABS} path={path} onNavigate={setPath}>
 *     {isTab ? <TabShell>{page}</TabShell> : page}
 *   </AppShell>
 *
 * 탭 경로(tabs 의 href)끼리는 바깥 경계의 key 를 공유해 탭바가 살아남고 본문만 가로 축으로 미끄러진다. 그 밖(상세)은
 * 경로마다 교체돼 drill 로 들어온다. onNavigate 가 없으면 탭은 <a href>(전체 로드), 뒤로가기 fallback 은 location.replace 다.
 *
 * 지원 라우터(next · react-router · @tanstack/react-router)는 `comwit-ui add app-shell --router <name>` 으로
 * 완성된 구현을 다시 받을 수 있다.
 */

import * as React from 'react'
import { AppShell as AppShellPrimitive, NavDepthProvider } from '@comwit/ui'

import { cn } from '../lib/utils'
import {
  PageBoundary,
  PageTransition,
  appTransitions,
  type PageTransitionConfig,
} from '../components/ui/page-transition'
import { PullIndicator } from '../components/ui/pull-to-refresh'
import { TabBar, type AppTab } from './tab-bar.generic'

type AppShellProps = {
  /** 탭 목록 — 순서가 곧 탭바 순서이자 전환 방향. */
  tabs: readonly AppTab[]
  /** 현재 경로. 렌더와 같은 순간의 값이어야 한다(mount 시점의 window.location 을 읽지 말 것). */
  path: string
  /** 탭·뒤로가기 fallback 이 여기로 간다. 없으면 전체 로드. */
  onNavigate?: (href: string) => void
  /** 전환 규칙. 기본은 appTransitions(탭 경로): 탭끼리 가로 축, 그 밖은 drill. 규칙 문법: https://ssgoi.dev/llms.txt */
  transitions?: PageTransitionConfig
  /** 스크롤러 위에 붙는 것(설치 배너 등). 있으면 상단 safe-area 는 이쪽이 갖는다. */
  top?: React.ReactNode
  /** 당겨서 새로고침. 없으면 제스처가 꺼진다. */
  onRefresh?: () => Promise<unknown> | void
  className?: string
  children: React.ReactNode
}

type AppShellContextValue = {
  tabs: readonly AppTab[]
  path: string
  onNavigate?: (href: string) => void
}

const AppShellContext = React.createContext<AppShellContextValue>({ tabs: [], path: '/' })

function AppShell({
  tabs,
  path,
  onNavigate,
  transitions,
  top,
  onRefresh,
  className,
  children,
}: AppShellProps) {
  const navRouter = React.useMemo(
    () => (onNavigate ? { back: () => window.history.back(), replace: onNavigate } : undefined),
    [onNavigate]
  )
  const tabPaths = React.useMemo(() => tabs.map((tab) => tab.href), [tabs])
  const config = React.useMemo(
    () => transitions ?? appTransitions(tabPaths),
    [transitions, tabPaths]
  )
  const context = React.useMemo(() => ({ tabs, path, onNavigate }), [tabs, path, onNavigate])

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
          <AppShellPrimitive.Root onRefresh={onRefresh} resetKey={path}>
            <PullIndicator />
            <AppShellPrimitive.Scroller>
              <PageTransition config={config} className="min-h-full">
                <PageBoundary
                  path={path}
                  routeKey={tabPaths.includes(path) ? 'app-tabs' : path}
                  className="flex flex-col bg-background"
                >
                  {children}
                </PageBoundary>
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

/** 탭 화면의 셸 — 본문 경계만 교체되고 탭바는 그대로 선다. 탭 페이지들을 이걸로 감싼다. */
function TabShell({ className, children }: TabShellProps) {
  const { tabs, path, onNavigate } = React.useContext(AppShellContext)
  return (
    <>
      <PageBoundary
        path={path}
        className={cn('flex min-h-0 flex-1 flex-col bg-background', className)}
      >
        {children}
      </PageBoundary>
      <TabBar tabs={tabs} value={path} onNavigate={onNavigate} />
    </>
  )
}

export { AppShell, TabShell }
export type { AppShellProps, TabShellProps }
