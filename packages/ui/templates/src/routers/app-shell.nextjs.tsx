'use client'

/**
 * AppShell / TabShell — Next.js App Router integration, installed when comwit-ui add app-shell detects next.
 *
 * Complete mobile shell: phone frame, one main scroller, pull-to-refresh, shared scroll intent for app-bar
 * reveal and compact tab-bar behavior, page transitions, and back-navigation depth. @comwit/ui AppShell,
 * NavDepth, and ScrollChrome own behavior; this layer handles composition and appearance. Edit width
 * (max-w-md), background, and spinner here. globals.css [data-slot=app-shell] owns dvh height and installed-app adjustments.
 *
 *   // Client shell in the (app) layout: wrap the routed area once.
 *   <AppShell tabs={APP_TABS} top={<InstallBanner />}>{children}</AppShell>
 *   // (top-level)/layout.tsx: tab screens; only the body changes while the tab bar persists.
 *   <TabShell>{children}</TabShell>
 *   // (detail)/layout.tsx: fullscreen details; render children directly.
 *
 * Boundary IDs are public URLs derived from the layout's children-slot segments, with route groups and
 * interception markers removed. During @modal interception, the background slot stays unchanged even when
 * the browser URL changes. Tab href paths share the outer boundary key, keeping the tab bar while the
 * body slides horizontally. Other paths (details) replace that boundary, enter with drill, and move the
 * tab bar with the page. Defaults to appTransitions (tab axis + drill); supply transitions to customize.
 */

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppShell as AppShellPrimitive, NavDepthProvider, useScrollChrome } from '@comwit/ui'

import { cn } from '../lib/utils'
import {
  PageTransition,
  appTransitions,
  type PageTransitionConfig,
} from '../components/ui/page-transition'
import { PullIndicator } from '../components/ui/pull-to-refresh'
import { RouteBoundary, segmentsToPath, type RouteLocation } from './route-boundary.nextjs'
import { TabBar, type AppTab } from './tab-bar.nextjs'

type AppShellProps = {
  /** Tab list: order determines both the tab-bar order and transition direction. */
  tabs: readonly AppTab[]
  /** Transition rules. Defaults to appTransitions(tab paths): horizontal tab transitions, drill elsewhere. Syntax: https://ssgoi.dev/llms.txt */
  transitions?: PageTransitionConfig
  /** Content above the scroller, such as an install banner. When present, it owns the top safe area. */
  top?: React.ReactNode
  /** Pull-to-refresh callback. Omit to disable the gesture. */
  onRefresh?: () => Promise<unknown> | void
  className?: string
  children: React.ReactNode
}

const AppShellContext = React.createContext<{ tabs: readonly AppTab[] }>({ tabs: [] })

function AppShell({ tabs, transitions, top, onRefresh, className, children }: AppShellProps) {
  const router = useRouter()
  const navRouter = React.useMemo(
    () => ({ back: () => router.back(), replace: (href: string) => router.replace(href) }),
    [router]
  )
  const tabPaths = React.useMemo(() => tabs.map((tab) => tab.href), [tabs])
  const config = React.useMemo(
    () => transitions ?? appTransitions(tabPaths),
    [transitions, tabPaths]
  )
  const context = React.useMemo(() => ({ tabs }), [tabs])
  const resolve = React.useCallback(
    (location: RouteLocation) => resolveAppBoundary('app-shell', location, tabPaths),
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
          <AppShellPrimitive.Root onRefresh={onRefresh}>
            <React.Suspense fallback={null}>
              <ExpandChromeOnRouteChange />
            </React.Suspense>
            <PullIndicator />
            <AppShellPrimitive.Scroller>
              <PageTransition config={config} className="min-h-full">
                <RouteBoundary
                  resolve={resolve}
                  className="flex flex-col bg-background"
                  fallback={<div className="flex-1 bg-background" aria-hidden="true" />}
                >
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

/** Isolate URL reading in a small Suspense leaf so the rest of the shell prerenders statically. Path changes expand hidden app bars and compact tab bars. */
function ExpandChromeOnRouteChange() {
  const pathname = usePathname()
  const { expand } = useScrollChrome()
  React.useEffect(() => {
    expand()
  }, [expand, pathname])
  return null
}

type TabShellProps = {
  className?: string
  children: React.ReactNode
}

/** Tab-screen shell: only the main-content body boundary changes while the tab bar persists. Place in the (top-level) layout. */
function TabShell({ className, children }: TabShellProps) {
  const { tabs } = React.useContext(AppShellContext)
  return (
    <>
      <RouteBoundary
        resolve={resolveMainContent}
        className={cn('flex min-h-0 flex-1 flex-col bg-background', className)}
        fallback={<div className="flex-1 bg-background" aria-hidden="true" />}
      >
        {children}
      </RouteBoundary>
      <TabBar tabs={tabs} />
    </>
  )
}

export type AppBoundaryName = 'app-shell' | 'main-content'

/**
 * Boundary ID (logical path) and key (DOM lifetime). Tab paths share the app-shell boundary key to preserve
 * the tab bar. Pass this as RouteBoundary resolve when composing your own shell.
 */
function resolveAppBoundary(
  name: AppBoundaryName,
  { selectedSegments }: RouteLocation,
  tabPaths: readonly string[]
) {
  const id = segmentsToPath(selectedSegments)
  const keepTabs = name === 'app-shell' && tabPaths.includes(id)
  return { id, key: keepTabs ? 'app-tabs' : id }
}

const resolveMainContent = (location: RouteLocation) =>
  resolveAppBoundary('main-content', location, [])

export { AppShell, TabShell, resolveAppBoundary }
export type { AppShellProps, TabShellProps }
