'use client'

/**
 * comwit-ui — headless, unstyled pull-to-refresh primitive.
 *
 * Pull down at the top of the scroller to refresh. Owns the gesture, state machine, and rubber-band resistance.
 *
 *   <PullToRefresh.Root onRefresh={reload}>
 *     <PullToRefresh.Indicator>{({ state }) => …}</PullToRefresh.Indicator>
 *     <PullToRefresh.Scroller ref={scrollRef}>{content}</PullToRefresh.Scroller>
 *   </PullToRefresh.Root>
 *
 * - Root: wrapper that writes pull distance in pixels to --ptr-pull on its own element, with no rerenders while dragging.
 * - Scroller: overflow-y:auto scroller with required structural inline styles. Pass its ref to ScrollChromeProvider.
 *   Never transform the content; it contains sticky app bars and bottom navigation.
 * - Indicator: exposes data-state="idle | pulling | armed | refreshing" and data-transition.
 *   Consumer CSS uses var(--ptr-pull) to draw position, opacity, and rotation.
 *
 * Touch suppresses native bounce; mouse dragging also works for desktop previews.
 */

import * as React from 'react'

import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'

const ROOT_NAME = 'PullToRefresh'
const PULL_VAR = '--ptr-pull'
/** Minimum vertical movement in pixels to recognize a pull, preventing tiny touches or horizontal swipes from triggering it. */
const ENGAGE_SLOP = 8
/** Return transition duration after release, in milliseconds. Match the consumer's CSS transition. */
const SETTLE_MS = 360

type PullState = 'idle' | 'pulling' | 'armed' | 'refreshing'
type PullSnapshot = { state: PullState; transition: boolean }

type PullStore = {
  get: () => PullSnapshot
  subscribe: (listener: () => void) => () => void
  set: (patch: Partial<PullSnapshot>) => void
}

function usePullStore(): PullStore {
  const snapshot = React.useRef<PullSnapshot>({ state: 'idle', transition: false })
  const listeners = React.useRef(new Set<() => void>())
  return React.useMemo(
    () => ({
      get: () => snapshot.current,
      subscribe: (listener) => {
        listeners.current.add(listener)
        return () => listeners.current.delete(listener)
      },
      set: (patch) => {
        const next = { ...snapshot.current, ...patch }
        if (
          next.state === snapshot.current.state &&
          next.transition === snapshot.current.transition
        )
          return
        snapshot.current = next
        listeners.current.forEach((listener) => listener())
      },
    }),
    []
  )
}

type PullToRefreshContextValue = {
  store: PullStore
  setScroller: (element: HTMLElement | null) => void
}
const [PullToRefreshProvider, usePullToRefreshContext] =
  createContext<PullToRefreshContextValue>(ROOT_NAME)

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>

interface PullToRefreshRootProps extends PrimitiveDivProps {
  /** Refresh operation. State remains refreshing until the returned Promise settles. */
  onRefresh: () => Promise<unknown> | void
  /** Disable gestures when false (for example, when desktop uses document scrolling). */
  enabled?: boolean
  /** Release beyond this pull distance in pixels to trigger a refresh. Defaults to 64. */
  threshold?: number
  /** Rubber-band limit in pixels. Defaults to 130. */
  maxPull?: number
  /** Resting pull distance while refreshing, in pixels. Defaults to 60. */
  resting?: number
}

const PullToRefreshRoot = React.forwardRef<HTMLDivElement, PullToRefreshRootProps>(
  (props, forwardedRef) => {
    const {
      onRefresh,
      enabled = true,
      threshold = 64,
      maxPull = 130,
      resting = 60,
      ...rootProps
    } = props
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const composedRef = useComposedRefs(forwardedRef, wrapperRef)
    const [scroller, setScroller] = React.useState<HTMLElement | null>(null)
    const store = usePullStore()
    const refreshRef = React.useRef(onRefresh)
    React.useEffect(() => {
      refreshRef.current = onRefresh
    }, [onRefresh])

    React.useEffect(() => {
      const wrapper = wrapperRef.current
      if (!scroller || !wrapper || !enabled) return

      let startY = 0
      let startX = 0
      let pulling = false
      let refreshing = false
      let current = 0
      let mouseId: number | null = null
      let settleTimer = 0

      const apply = (px: number) => wrapper.style.setProperty(PULL_VAR, `${px}`)
      const reset = () => wrapper.style.removeProperty(PULL_VAR)
      /** Rubber-band resistance: movement slows as pulling increases, approaching maxPull asymptotically. */
      const resist = (dy: number) => maxPull * (1 - Math.exp(-dy / maxPull))

      /** Yield to any ancestor between the target and scroller that can still scroll upward. */
      const yieldsToInnerScroll = (target: EventTarget | null) => {
        let element = target as HTMLElement | null
        while (element && element !== scroller) {
          if (element.scrollTop > 0) {
            const overflowY = getComputedStyle(element).overflowY
            if (overflowY === 'auto' || overflowY === 'scroll') return true
          }
          element = element.parentElement
        }
        return false
      }

      const begin = (x: number, y: number) => {
        startY = y
        startX = x
        pulling = false
        current = 0
        window.clearTimeout(settleTimer)
        store.set({ transition: false })
      }

      /** Returning true tells the caller to prevent the default native scrolling/bounce. */
      const move = (x: number, y: number, target: EventTarget | null) => {
        if (!pulling) {
          const dy = y - startY
          const dx = x - startX
          const verticalDown = dy > ENGAGE_SLOP && dy > Math.abs(dx)
          if (verticalDown && scroller.scrollTop <= 0 && !yieldsToInnerScroll(target)) {
            pulling = true
            startY = y // Rebase the starting point to prevent a jump when the gesture activates.
            current = 0
            apply(0)
            store.set({ state: 'pulling' })
            return true
          }
          // Before reaching the top, keep rebasing so pulling starts from zero as soon as the top is reached.
          if (scroller.scrollTop > 0) startY = y
          return false
        }
        const delta = y - startY
        if (delta <= 0) {
          current = 0
          apply(0)
          pulling = false
          store.set({ state: 'idle' })
          return false
        }
        current = resist(delta)
        apply(current)
        store.set({ state: current >= threshold ? 'armed' : 'pulling' })
        return true
      }

      const settleBack = () => {
        store.set({ state: 'idle', transition: true })
        apply(0)
        settleTimer = window.setTimeout(() => {
          reset()
          store.set({ transition: false })
        }, SETTLE_MS)
      }

      const runRefresh = async () => {
        refreshing = true
        current = resting
        store.set({ state: 'refreshing', transition: true })
        apply(resting)
        try {
          navigator.vibrate?.(8)
        } catch {
          /* Ignore unsupported browsers. */
        }
        try {
          await refreshRef.current()
        } finally {
          refreshing = false
          settleBack()
        }
      }

      const end = () => {
        if (!pulling && current === 0) return
        const shouldRefresh = pulling && current >= threshold && !refreshing
        pulling = false
        if (shouldRefresh) void runRefresh()
        else settleBack()
      }

      // ── Touch: touchmove must be non-passive to prevent native bounce. ──
      const onTouchStart = (event: TouchEvent) => {
        if (refreshing || event.touches.length !== 1) return
        begin(event.touches[0].clientX, event.touches[0].clientY)
      }
      const onTouchMove = (event: TouchEvent) => {
        if (refreshing) return
        if (move(event.touches[0].clientX, event.touches[0].clientY, event.target))
          event.preventDefault()
      }

      // ── Mouse dragging: allow testing the gesture in desktop previews. ──
      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || refreshing) return
        mouseId = event.pointerId
        begin(event.clientX, event.clientY)
      }
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerId !== mouseId || refreshing) return
        const wasPulling = pulling
        if (move(event.clientX, event.clientY, event.target)) {
          if (!wasPulling) scroller.setPointerCapture(event.pointerId)
          event.preventDefault()
        }
      }
      const onPointerUp = (event: PointerEvent) => {
        if (event.pointerId !== mouseId) return
        mouseId = null
        if (scroller.hasPointerCapture(event.pointerId))
          scroller.releasePointerCapture(event.pointerId)
        end()
      }

      scroller.addEventListener('touchstart', onTouchStart, { passive: true })
      scroller.addEventListener('touchmove', onTouchMove, { passive: false })
      scroller.addEventListener('touchend', end, { passive: true })
      scroller.addEventListener('touchcancel', end, { passive: true })
      scroller.addEventListener('pointerdown', onPointerDown)
      scroller.addEventListener('pointermove', onPointerMove)
      scroller.addEventListener('pointerup', onPointerUp)
      scroller.addEventListener('pointercancel', onPointerUp)
      return () => {
        scroller.removeEventListener('touchstart', onTouchStart)
        scroller.removeEventListener('touchmove', onTouchMove)
        scroller.removeEventListener('touchend', end)
        scroller.removeEventListener('touchcancel', end)
        scroller.removeEventListener('pointerdown', onPointerDown)
        scroller.removeEventListener('pointermove', onPointerMove)
        scroller.removeEventListener('pointerup', onPointerUp)
        scroller.removeEventListener('pointercancel', onPointerUp)
        window.clearTimeout(settleTimer)
        reset()
        store.set({ state: 'idle', transition: false })
      }
    }, [scroller, enabled, threshold, maxPull, resting, store])

    return (
      <PullToRefreshProvider store={store} setScroller={setScroller}>
        <Primitive.div data-enabled={enabled ? '' : undefined} {...rootProps} ref={composedRef} />
      </PullToRefreshProvider>
    )
  }
)
PullToRefreshRoot.displayName = ROOT_NAME

const SCROLLER_NAME = 'PullToRefreshScroller'

/** Gesture scroller. Enforces overflow-y:auto and overscroll-behavior-y:contain inline. */
const PullToRefreshScroller = React.forwardRef<HTMLElement, PrimitiveDivProps>(
  (props, forwardedRef) => {
    const { style, ...scrollerProps } = props
    const context = usePullToRefreshContext(SCROLLER_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.setScroller)
    return (
      <Primitive.div
        {...scrollerProps}
        ref={composedRef}
        style={{ overflowY: 'auto', overscrollBehaviorY: 'contain', ...style }}
      />
    )
  }
)
PullToRefreshScroller.displayName = SCROLLER_NAME

const INDICATOR_NAME = 'PullToRefreshIndicator'

interface PullToRefreshIndicatorProps extends Omit<PrimitiveDivProps, 'children'> {
  children?: React.ReactNode | ((snapshot: PullSnapshot) => React.ReactNode)
}

/** Indicator container exposing state through data-*. Consumer CSS draws position and appearance with var(--ptr-pull). */
const PullToRefreshIndicator = React.forwardRef<HTMLDivElement, PullToRefreshIndicatorProps>(
  (props, forwardedRef) => {
    const { children, ...indicatorProps } = props
    const { store } = usePullToRefreshContext(INDICATOR_NAME)
    const snapshot = React.useSyncExternalStore(store.subscribe, store.get, store.get)
    return (
      <Primitive.div
        role="status"
        aria-live="polite"
        data-state={snapshot.state}
        data-transition={snapshot.transition ? '' : undefined}
        {...indicatorProps}
        ref={forwardedRef}
      >
        {typeof children === 'function' ? children(snapshot) : children}
      </Primitive.div>
    )
  }
)
PullToRefreshIndicator.displayName = INDICATOR_NAME

/* ---------------------------------------------------------------------------------------------- */

const Root = PullToRefreshRoot
const Scroller = PullToRefreshScroller
const Indicator = PullToRefreshIndicator

export {
  PullToRefreshRoot,
  PullToRefreshScroller,
  PullToRefreshIndicator,
  //
  Root,
  Scroller,
  Indicator,
}
export type { PullToRefreshRootProps, PullToRefreshIndicatorProps, PullState, PullSnapshot }
