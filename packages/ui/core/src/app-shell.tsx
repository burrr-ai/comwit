'use client'

/**
 * Headless mobile app scroll structure. Root combines ScrollChromeProvider and PullToRefresh.Root in a relative flex column (flex: 1, min-height: 0), owns --ptr-pull, disables pulling without onRefresh, and expands hidden controls when resetKey changes. Scroller is the sole main scroller and transition anchor: relative positioning, z-index: 0, overflow-x: clip, overflow-y: auto, contained vertical overscroll, and hidden scrollbars. Do not insert overflow ancestors between it and sticky controls; iOS WebKit cannot synchronize sticky positioning across them. Never transform its content because sticky app/tab bars live inside. Indicator exposes PullToRefresh states idle, pulling, armed, and refreshing. Consumer templates own the phone frame, indicator appearance, transitions, and route boundaries. Compose Root with Indicator and Scroller.
 */

import * as React from 'react'

import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'
import {
  PullToRefreshIndicator,
  PullToRefreshRoot,
  PullToRefreshScroller,
  type PullToRefreshRootProps,
} from './pull-to-refresh'
import { ScrollChromeProvider } from './scroll-chrome'

const ROOT_NAME = 'AppShell'

type AppShellContextValue = {
  setScroller: (element: HTMLElement | null) => void
}
const [AppShellProvider, useAppShellContext] = createContext<AppShellContextValue>(ROOT_NAME)

interface AppShellRootProps extends Omit<PullToRefreshRootProps, 'onRefresh' | 'enabled'> {
  /** Refresh callback. Omit to disable the pull gesture. */
  onRefresh?: PullToRefreshRootProps['onRefresh']
  /** Expand hidden app and tab bars when this value changes, such as on navigation. */
  resetKey?: unknown
}

/** Let the scroller fill the remaining height and position the indicator relative to this root. */
const ROOT_STYLE: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  flex: '1 1 0%',
}

const noRefresh = () => undefined

const AppShellRoot = React.forwardRef<HTMLDivElement, AppShellRootProps>((props, forwardedRef) => {
  const { onRefresh, resetKey, style, ...rootProps } = props
  const [scroller, setScroller] = React.useState<HTMLElement | null>(null)
  // Recreate the ref object when the scroller changes so ScrollChromeProvider reattaches, including after Suspense mounts.
  const scrollRef = React.useMemo(() => ({ current: scroller }), [scroller])

  return (
    <AppShellProvider setScroller={setScroller}>
      <ScrollChromeProvider scrollRef={scrollRef} resetKey={resetKey}>
        <PullToRefreshRoot
          onRefresh={onRefresh ?? noRefresh}
          enabled={onRefresh != null}
          {...rootProps}
          ref={forwardedRef}
          style={{ ...ROOT_STYLE, ...style }}
        />
      </ScrollChromeProvider>
    </AppShellProvider>
  )
})
AppShellRoot.displayName = ROOT_NAME

const SCROLLER_NAME = 'AppShellScroller'

type PrimitiveMainProps = React.ComponentPropsWithoutRef<typeof Primitive.main>

/** Transition anchor, stacking context, horizontal clipping, and scroll axis. PullToRefresh.Scroller adds vertical overflow and overscroll rules. */
const SCROLLER_STYLE: React.CSSProperties = {
  position: 'relative',
  zIndex: 0,
  overflowX: 'clip',
  minHeight: 0,
  flex: '1 1 0%',
  scrollbarWidth: 'none',
}

const AppShellScroller = React.forwardRef<HTMLElement, PrimitiveMainProps>(
  (props, forwardedRef) => {
    const { style, ...scrollerProps } = props
    const context = useAppShellContext(SCROLLER_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.setScroller)
    return (
      <PullToRefreshScroller asChild>
        <Primitive.main
          {...scrollerProps}
          ref={composedRef}
          style={{ ...SCROLLER_STYLE, ...style }}
        />
      </PullToRefreshScroller>
    )
  }
)
AppShellScroller.displayName = SCROLLER_NAME

const AppShellIndicator = PullToRefreshIndicator

/* ---------------------------------------------------------------------------------------------- */

const Root = AppShellRoot
const Scroller = AppShellScroller
const Indicator = AppShellIndicator

export {
  AppShellRoot,
  AppShellScroller,
  AppShellIndicator,
  //
  Root,
  Scroller,
  Indicator,
}
export type { AppShellRootProps }
