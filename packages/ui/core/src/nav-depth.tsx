'use client'

/**
 * comwit-ui — headless, router-independent navigation depth.
 *
 * Tracks whether a previous entry exists inside the app. While mounted, wraps history.pushState and stamps each
 * entry with its depth. Back/close buttons go back when possible, or replace with the logical parent URL when opened
 * directly through a shared link, reload, or PWA launch. This avoids leaving the app or creating a back-navigation loop.
 *
 *   <NavDepthProvider router={{ back: () => router.back(), replace: (href) => router.replace(href) }}>…</NavDepthProvider>
 *   const back = useBackNavigation('/posts')   // <AppBarBackButton onClick={back} />
 *
 * Without a router, uses history.back() and location.replace() (full page load). Supply a memoized adapter for soft
 * navigation. Mount the provider once outside route boundaries; remounting it with each page resets depth.
 * history.length and referrer cannot prove a previous entry belongs to the app, so every fresh app starts at depth 0.
 */

import * as React from 'react'

type NavDepthRouter = {
  back: () => void
  replace: (href: string) => void
}

type HistoryPort = Pick<History, 'state' | 'pushState' | 'replaceState'>
type Entry = { session: string; depth: number }

const ENTRY_KEY = '__comwitAppNavigation'

const DEFAULT_ROUTER: NavDepthRouter = {
  back: () => window.history.back(),
  replace: (href) => window.location.replace(href),
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** randomUUID requires a secure context and is unavailable on phones at http://<LAN IP>; getRandomValues works everywhere. */
function createSessionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

/** Count actual entries, including query-only pushes, without touching the router's state keys. */
function installNavigationHistory(history: HistoryPort, session: string) {
  const originalPush = history.pushState
  const originalReplace = history.replaceState
  let active = true

  const read = (): Entry | undefined => {
    const entry = record(record(history.state)[ENTRY_KEY])
    return entry.session === session &&
      typeof entry.depth === 'number' &&
      Number.isSafeInteger(entry.depth) &&
      entry.depth >= 0
      ? { session, depth: entry.depth }
      : undefined
  }
  const stamp = (data: unknown, depth: number) => ({
    ...record(data),
    [ENTRY_KEY]: { session, depth },
  })

  // A fresh app (full load or remount) starts a new session at depth 0, even if the browser retained old state.
  originalReplace.call(history, stamp(history.state, 0), '')

  function pushState(data: unknown, unused: string, url?: string | URL | null) {
    const current = read()
    originalPush.call(
      history,
      active ? stamp(data, current ? current.depth + 1 : 0) : data,
      unused,
      url
    )
  }
  function replaceState(data: unknown, unused: string, url?: string | URL | null) {
    originalReplace.call(history, active ? stamp(data, read()?.depth ?? 0) : data, unused, url)
  }
  history.pushState = pushState
  history.replaceState = replaceState

  return {
    // Read at the moment of interaction; browser back/forward restores the stamp on that entry.
    canGoBack: () => active && (read()?.depth ?? 0) > 0,
    dispose() {
      active = false
      // Another router/bridge wrapper may have been installed later. Leave it intact and pass through calls reaching ours.
      if (history.pushState === pushState) history.pushState = originalPush
      if (history.replaceState === replaceState) history.replaceState = originalReplace
    },
  }
}

type NavDepthContextValue = {
  canGoBack: () => boolean
  router: NavDepthRouter
}

const NavDepthContext = React.createContext<NavDepthContextValue>({
  canGoBack: () => false,
  router: DEFAULT_ROUTER,
})
NavDepthContext.displayName = 'NavDepthContext'

interface NavDepthProviderProps {
  /** Soft-navigation adapter. Defaults to history.back() and location.replace(). */
  router?: NavDepthRouter
  children: React.ReactNode
}

function NavDepthProvider({ router, children }: NavDepthProviderProps) {
  const tracker = React.useRef<ReturnType<typeof installNavigationHistory> | null>(null)
  React.useEffect(() => {
    const navigation = installNavigationHistory(window.history, createSessionId())
    tracker.current = navigation
    return () => {
      navigation.dispose()
      tracker.current = null
    }
  }, [])
  const canGoBack = React.useCallback(() => tracker.current?.canGoBack() ?? false, [])
  const value = React.useMemo(
    () => ({ canGoBack, router: router ?? DEFAULT_ROUTER }),
    [canGoBack, router]
  )
  return <NavDepthContext.Provider value={value}>{children}</NavDepthContext.Provider>
}
NavDepthProvider.displayName = 'NavDepthProvider'

/** Back/close onClick handler: go back with in-app history, otherwise replace with fallback. */
function useBackNavigation(fallback: string): () => void {
  const { canGoBack, router } = React.useContext(NavDepthContext)
  return React.useCallback(() => {
    if (canGoBack()) router.back()
    else router.replace(fallback)
  }, [canGoBack, router, fallback])
}

/** Getter for controls that decide themselves. Call from event handlers, not during render. */
function useCanGoBack(): () => boolean {
  return React.useContext(NavDepthContext).canGoBack
}

export { NavDepthProvider, useBackNavigation, useCanGoBack }
export type { NavDepthProviderProps, NavDepthRouter }
