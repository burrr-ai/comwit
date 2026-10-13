'use client'

/**
 * AppShell / TabShell — default implementation installed when no router is detected. Supply the current path manually.
 *
 * Complete mobile shell: phone frame, one main scroller, pull-to-refresh, shared scroll intent for app-bar
 * reveal and compact tab-bar behavior, page transitions, and back-navigation depth. @comwit/ui AppShell,
 * NavDepth, and ScrollChrome own behavior; this layer handles composition and appearance. Edit width
 * (max-w-md), background, and spinner here. globals.css [data-slot=app-shell] owns dvh height and installed-app adjustments.
 *
 *   const [path, setPath] = useState('/') // In real apps, use the router pathname and push.
 *   <AppShell tabs={TABS} path={path} onNavigate={setPath}>
 *     {isTab ? <TabShell>{page}</TabShell> : page}
 *   </AppShell>
 *
 * Tab href paths share the outer boundary key, preserving the tab bar while the body slides horizontally.
 * Other paths (details) replace that boundary and enter with drill. Without onNavigate, tabs use a href
 * with full page loads, and back-navigation fallback uses location.replace.
 *
 * For supported routers (next, react-router, @tanstack/react-router), reinstall the complete integration with
 * comwit-ui add app-shell --router <name>.
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
  /** Tab list: order determines both the tab-bar order and transition direction. */
  tabs: readonly AppTab[]
  /** Current path, synchronized with render. Do not read window.location only at mount time. */
  path: string
  /** Tab navigation and back-navigation fallback use this callback. Defaults to full page loads. */
  onNavigate?: (href: string) => void
  /** Transition rules. Defaults to appTransitions(tab paths): horizontal tab transitions, drill elsewhere. Syntax: https://ssgoi.dev/llms.txt */
  transitions?: PageTransitionConfig
  /** Content above the scroller, such as an install banner. When present, it owns the top safe area. */
  top?: React.ReactNode
  /** Pull-to-refresh callback. Omit to disable the gesture. */
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
          {/* resetKey: expand hidden app bars and compact tab bars when the path changes. */}
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

/** Shell for tab screens: only the body boundary changes while the tab bar persists. Wrap tab pages with this. */
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
