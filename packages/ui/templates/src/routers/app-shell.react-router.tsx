'use client'

/**
 * AppShell / TabShell — React Router integration, installed when comwit-ui add app-shell detects react-router.
 *
 * Complete mobile shell: phone frame, one main scroller, pull-to-refresh, shared scroll intent for app-bar
 * reveal and compact tab-bar behavior, page transitions, and back-navigation depth. @comwit/ui AppShell,
 * NavDepth, and ScrollChrome own behavior; this layer handles composition and appearance. Edit width
 * (max-w-md), background, and spinner here. globals.css [data-slot=app-shell] owns dvh height and installed-app adjustments.
 *
 *   // App root: wrap the routed area (Outlet) once.
 *   <AppShell tabs={APP_TABS}><Outlet /></AppShell>
 *   // Layout route for tab screens: only the body changes while the tab bar persists.
 *   <TabShell><Outlet /></TabShell>
 *
 * Tab href paths share the outer boundary key, preserving the tab bar while the body slides horizontally.
 * Other paths (details) replace that boundary, enter with drill, and move the tab bar with the page.
 * Defaults to appTransitions; supply transitions to customize.
 */

import * as React from 'react'
import { useLocation, useNavigate, type Location } from 'react-router'
import { AppShell as AppShellPrimitive, NavDepthProvider } from '@comwit/ui'

import { cn } from '../lib/utils'
import {
  PageTransition,
  appTransitions,
  type PageTransitionConfig,
} from '../components/ui/page-transition'
import { PullIndicator } from '../components/ui/pull-to-refresh'
import { RouteBoundary } from './route-boundary.react-router'
import { TabBar, type AppTab } from './tab-bar.react-router'

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
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navRouter = React.useMemo(
    () => ({
      back: () => void navigate(-1),
      replace: (href: string) => void navigate(href, { replace: true }),
    }),
    [navigate]
  )
  const tabPaths = React.useMemo(() => tabs.map((tab) => tab.href), [tabs])
  const config = React.useMemo(
    () => transitions ?? appTransitions(tabPaths),
    [transitions, tabPaths]
  )
  const context = React.useMemo(() => ({ tabs }), [tabs])
  const resolve = React.useCallback(
    (location: Location) => resolveAppBoundary(location.pathname, tabPaths),
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
          {/* resetKey: expand hidden app bars and compact tab bars when the path changes. */}
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

/** Tab-screen shell: only the body boundary changes while the tab bar persists. Place in the tabs' layout route. */
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

/** Outer boundary ID (path) and key (DOM lifetime). Tab paths share the key to preserve the tab bar. */
function resolveAppBoundary(pathname: string, tabPaths: readonly string[]) {
  return { id: pathname, key: tabPaths.includes(pathname) ? 'app-tabs' : pathname }
}

export { AppShell, TabShell, resolveAppBoundary }
export type { AppShellProps, TabShellProps }
