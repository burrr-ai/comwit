'use client'

/**
 * comwit-ui — headless, unstyled scroll-chrome.
 *
 * Determines mobile app chrome (app bar/bottom navigation) scroll intent once and shares it. Separate listeners
 * would drift in sensitivity and transition timing, so accumulated movement with hysteresis produces one compact
 * state. Ignores browser-driven changes such as route scroll restoration, accepting only scroll events preceded
 * by real vertical touch gestures, wheel input, or keyboard input.
 *
 *   <ScrollChromeProvider scrollRef={mainRef} resetKey={pathname}>…</ScrollChromeProvider>
 *   const { compact, expand } = useScrollChrome()
 *
 * Omit scrollRef to observe window scrolling. Changing resetKey (route transition) expands the chrome.
 * For a sticky tab bar inside the scroller, let the scroller own stacking and horizontal clipping
 * (relative z-0 overflow-x-clip). Avoid overflow ancestors between the scroller and tab bar, which cause iOS jitter.
 * Elements beneath the provider expose data-scroll-chrome="compact" or "expanded" for CSS.
 */

import * as React from 'react'

const TOP_EDGE = 12
const COLLAPSE_AFTER = 72
const DOWN_DISTANCE = 18
const UP_DISTANCE = 6
const TOUCH_INTENT_SLOP = 6
const USER_SCROLL_IDLE_MS = 180

type ScrollChromeValue = {
  /** The user scrolled down far enough: hide the reveal app bar and compact the bottom navigation. */
  compact: boolean
  /** Immediately restore the expanded size when the tab bar is pressed or receives focus. */
  expand: () => void
}

const ScrollChromeContext = React.createContext<ScrollChromeValue>({
  compact: false,
  expand: () => undefined,
})
ScrollChromeContext.displayName = 'ScrollChromeContext'

interface ScrollChromeProviderProps {
  /** Scroller to observe. Defaults to window. */
  scrollRef?: React.RefObject<HTMLElement | null>
  /** Expand when this value changes (for example, a route transition). */
  resetKey?: unknown
  children: React.ReactNode
}

function ScrollChromeProvider({ scrollRef, resetKey, children }: ScrollChromeProviderProps) {
  const [compact, setCompact] = React.useState(false)
  const expand = React.useCallback(() => setCompact(false), [])

  React.useEffect(() => {
    setCompact(false)
  }, [resetKey])

  React.useEffect(() => {
    const element = scrollRef ? scrollRef.current : null
    if (scrollRef && !element) return
    const target: HTMLElement | Window = element ?? window
    const getTop = () => (element ? element.scrollTop : window.scrollY)

    let lastTop = getTop()
    let direction: -1 | 0 | 1 = 0
    let distance = 0
    let frame = 0
    let touchActive = false
    let touchStartX = 0
    let touchStartY = 0
    let userScrollIntent = false
    let intentTimer = 0

    const clearIntentTimer = () => {
      if (!intentTimer) return
      window.clearTimeout(intentTimer)
      intentTimer = 0
    }
    const disarm = () => {
      clearIntentTimer()
      userScrollIntent = false
    }
    const arm = () => {
      clearIntentTimer()
      userScrollIntent = true
    }
    const scheduleIntentEnd = () => {
      clearIntentTimer()
      intentTimer = window.setTimeout(() => {
        intentTimer = 0
        userScrollIntent = false
      }, USER_SCROLL_IDLE_MS)
    }

    const measure = () => {
      frame = 0
      const currentTop = getTop()
      const delta = currentTop - lastTop
      lastTop = currentTop

      if (!userScrollIntent) {
        direction = 0
        distance = 0
        return
      }
      if (currentTop <= TOP_EDGE) {
        direction = 0
        distance = 0
        setCompact(false)
        return
      }
      if (Math.abs(delta) < 0.5) return
      const nextDirection: -1 | 1 = delta > 0 ? 1 : -1
      if (nextDirection !== direction) {
        direction = nextDirection
        distance = 0
      }
      distance += Math.abs(delta)

      if (direction === 1 && currentTop > COLLAPSE_AFTER && distance >= DOWN_DISTANCE) {
        setCompact(true)
        distance = 0
      } else if (direction === -1 && distance >= UP_DISTANCE) {
        setCompact(false)
        distance = 0
      }
      if (!touchActive) scheduleIntentEnd()
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }
    const onTouchStart = (event: Event) => {
      const touches = (event as TouchEvent).touches
      disarm()
      direction = 0
      distance = 0
      lastTop = getTop()
      if (touches.length !== 1) {
        touchActive = false
        return
      }
      touchActive = true
      touchStartX = touches[0].clientX
      touchStartY = touches[0].clientY
    }
    const onTouchMove = (event: Event) => {
      const touches = (event as TouchEvent).touches
      if (!touchActive || touches.length !== 1 || userScrollIntent) return
      const dx = touches[0].clientX - touchStartX
      const dy = touches[0].clientY - touchStartY
      if (Math.abs(dy) < TOUCH_INTENT_SLOP || Math.abs(dy) <= Math.abs(dx)) return
      arm()
    }
    const onTouchEnd = () => {
      touchActive = false
      if (userScrollIntent) scheduleIntentEnd()
    }
    const onTouchCancel = () => {
      touchActive = false
      disarm()
    }
    const onWheel = () => {
      // Do not change lastTop: passive wheel events may arrive after compositor scrolling, so reading it again here
      // would make the updated position the baseline and swallow a single wheel step entirely.
      // (measure already updates lastTop on every scroll, including programmatic position changes.)
      if (!userScrollIntent) {
        direction = 0
        distance = 0
      }
      touchActive = false
      arm()
      scheduleIntentEnd()
    }
    // Keyboard scrolling (Space, PageDown, arrow keys) also signals user intent.
    const onKeyDown = (event: Event) => {
      const key = (event as KeyboardEvent).key
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(key)) {
        arm()
        scheduleIntentEnd()
      }
    }

    const passive = { passive: true } as const
    target.addEventListener('touchstart', onTouchStart, passive)
    target.addEventListener('touchmove', onTouchMove, passive)
    target.addEventListener('touchend', onTouchEnd, passive)
    target.addEventListener('touchcancel', onTouchCancel, passive)
    target.addEventListener('wheel', onWheel, passive)
    target.addEventListener('keydown', onKeyDown, passive)
    target.addEventListener('scroll', onScroll, passive)
    return () => {
      target.removeEventListener('touchstart', onTouchStart)
      target.removeEventListener('touchmove', onTouchMove)
      target.removeEventListener('touchend', onTouchEnd)
      target.removeEventListener('touchcancel', onTouchCancel)
      target.removeEventListener('wheel', onWheel)
      target.removeEventListener('keydown', onKeyDown)
      target.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      clearIntentTimer()
    }
  }, [scrollRef])

  const value = React.useMemo(() => ({ compact, expand }), [compact, expand])
  return (
    <ScrollChromeContext.Provider value={value}>
      <div style={{ display: 'contents' }} data-scroll-chrome={compact ? 'compact' : 'expanded'}>
        {children}
      </div>
    </ScrollChromeContext.Provider>
  )
}
ScrollChromeProvider.displayName = 'ScrollChromeProvider'

/** State from the nearest ScrollChromeProvider. Always expanded when no provider exists. */
function useScrollChrome(): ScrollChromeValue {
  return React.useContext(ScrollChromeContext)
}

export { ScrollChromeProvider, useScrollChrome }
export type { ScrollChromeProviderProps, ScrollChromeValue }
