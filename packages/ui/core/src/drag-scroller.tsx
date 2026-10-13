'use client'

/**
 * Headless transform-based horizontal scroller supporting mouse drag/flick momentum, wheel/trackpad, touch, arrow keys, and focus reveal. Inline translateX preserves position across display:none and rerenders; transformed bounds also support shared-element transitions. Compose Root with Track and optionally apiRef, initialOffset, and onOffsetCommit. Root enforces overflow:hidden, touch-action:pan-y, and user-select:none and exposes data-state="dragging". Consumers style cursor, spacing, and alignment; apiRef.scrollByAmount supports arrow buttons.
 */

import * as React from 'react'

import { composeEventHandlers } from './internal/compose-event-handlers'
import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'
import { useLayoutEffect } from './internal/use-layout-effect'

const FRICTION = 0.95 // Momentum decay per 16ms frame.
const MIN_VELOCITY = 0.02 // Stop momentum below this velocity in px/ms.
const DRAG_THRESHOLD = 8 // Movement threshold in pixels for drag capture and click suppression; smaller movement remains a tap.
const LINE_HEIGHT = 16 // Pixel normalization for wheel deltaMode=line.
const KEY_STEP_RATIO = 0.8 // Fraction of viewport width moved by each arrow-key press.
const CLICK_SWALLOW_MS = 350 // Suppress clicks during this interval after a drag.
const STEP_DURATION = 350 // Duration in milliseconds for button/imperative scroll tweens.

const ROOT_NAME = 'DragScroller'

type DragScrollerApi = {
  /** Smoothly move by px; positive values move toward the end. */
  scrollByAmount: (px: number) => void
  /** Smoothly move to an absolute position. */
  scrollToOffset: (px: number) => void
  /** Current position in pixels. */
  getOffset: () => number
}

type DragScrollerContextValue = {
  trackRef: React.RefObject<HTMLDivElement | null>
  restoredOffset: number
}
const [DragScrollerProvider, useDragScrollerContext] =
  createContext<DragScrollerContextValue>(ROOT_NAME)

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>

interface DragScrollerRootProps extends PrimitiveDivProps {
  /** Initial position on remount; later prop changes do not move the track. */
  initialOffset?: number
  /** Report the current position when hidden or unmounted, not on every frame. */
  onOffsetCommit?: (offset: number) => void
  /** Imperative API for arrow buttons and similar controls. */
  apiRef?: React.Ref<DragScrollerApi>
}

const DragScrollerRoot = React.forwardRef<HTMLDivElement, DragScrollerRootProps>(
  (props, forwardedRef) => {
    const { initialOffset = 0, onOffsetCommit, apiRef, style, children, ...rootProps } = props
    const viewportRef = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const composedRef = useComposedRefs(forwardedRef, viewportRef)

    const [restoredOffset] = React.useState(() =>
      Number.isFinite(initialOffset) ? Math.max(0, initialOffset) : 0
    )
    const offset = React.useRef(restoredOffset) // Current scroll offset in pixels; transform is translateX(-offset).
    const commitOffset = React.useRef(onOffsetCommit)
    const vel = React.useRef(0) // Pointer momentum velocity in px/ms.
    const max = React.useRef(0)
    const raf = React.useRef(0)
    const dragging = React.useRef(false) // The drag has crossed the threshold and captured the pointer.
    const start = React.useRef({ x: 0, off: 0, t: 0, pointerId: -1, pending: false })

    const apply = () => {
      const track = trackRef.current
      if (track) track.style.transform = `translate3d(${-offset.current}px,0,0)`
    }
    const clamp = (v: number) => (v < 0 ? 0 : v > max.current ? max.current : v)
    const computeMax = () => {
      const viewport = viewportRef.current
      const track = trackRef.current
      if (!viewport || !track || !viewport.clientWidth) return // Preserve max while display:none to retain position.
      max.current = Math.max(0, track.scrollWidth - viewport.clientWidth)
    }
    const setOffset = (v: number) => {
      offset.current = clamp(v)
      apply()
    }
    const stopMomentum = () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = 0
    }
    const setDragState = (on: boolean) => {
      const viewport = viewportRef.current
      if (!viewport) return
      if (on) viewport.setAttribute('data-state', 'dragging')
      else viewport.removeAttribute('data-state')
    }

    useLayoutEffect(() => {
      commitOffset.current = onOffsetCommit
    }, [onOffsetCommit])

    useLayoutEffect(() => {
      // Restore before transitions measure positions or the browser paints.
      computeMax()
      if (viewportRef.current?.clientWidth) setOffset(offset.current)
      return () => {
        stopMomentum()
        commitOffset.current?.(offset.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const momentum = () => {
      let last = performance.now()
      const step = (now: number) => {
        const dt = now - last
        last = now
        if (Math.abs(vel.current) < MIN_VELOCITY) return void (raf.current = 0)
        const next = clamp(offset.current + vel.current * dt)
        if (next === offset.current) return void ((vel.current = 0), (raf.current = 0)) // Reached an edge.
        offset.current = next
        apply()
        vel.current *= Math.pow(FRICTION, dt / 16) // Frame-rate-independent decay.
        raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    }

    // Smooth tween to an absolute target for buttons and imperative calls.
    const animateTo = (target: number) => {
      stopMomentum()
      computeMax()
      vel.current = 0
      const from = offset.current
      const to = clamp(target)
      if (from === to) return
      const startT = performance.now()
      const ease = (p: number) => 1 - Math.pow(1 - p, 3) // easeOutCubic
      const step = (now: number) => {
        const p = Math.min(1, (now - startT) / STEP_DURATION)
        offset.current = from + (to - from) * ease(p)
        apply()
        raf.current = p < 1 ? requestAnimationFrame(step) : 0
      }
      raf.current = requestAnimationFrame(step)
    }

    React.useImperativeHandle(
      apiRef,
      () => ({
        scrollByAmount: (px: number) => animateTo(offset.current + px),
        scrollToOffset: (px: number) => animateTo(px),
        getOffset: () => offset.current,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    )

    // Suppress one follow-up click after dragging or stopping momentum to prevent child Link navigation. Release after 350ms.
    const swallowNextClick = () => {
      const viewport = viewportRef.current
      if (!viewport) return
      let timer = 0
      const done = () => {
        window.clearTimeout(timer)
        viewport.removeEventListener('click', swallow, true)
      }
      const swallow = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        done()
      }
      viewport.addEventListener('click', swallow, true)
      timer = window.setTimeout(done, CLICK_SWALLOW_MS)
    }

    // Pointer dragging.
    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return // Primary mouse button, touch, or pen only.
      if (dragging.current || start.current.pending) return // Another pointer owns the gesture; isolate multitouch.
      const wasMoving = raf.current !== 0
      stopMomentum()
      computeMax()
      vel.current = 0
      dragging.current = false
      start.current = {
        x: event.clientX,
        off: offset.current,
        t: performance.now(),
        pointerId: event.pointerId,
        pending: true,
      }
      if (wasMoving) swallowNextClick() // A tap during inertia means stop, not navigate.
    }
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = start.current
      if (event.pointerId !== s.pointerId) return
      if (!s.pending && !dragging.current) return
      if (!dragging.current) {
        if (Math.abs(event.clientX - s.x) < DRAG_THRESHOLD) return
        // Capture only after crossing the threshold so taps remain clicks.
        dragging.current = true
        s.pending = false
        s.x = event.clientX // Rebase at the current point to avoid a jump.
        s.off = offset.current
        s.t = performance.now()
        viewportRef.current?.setPointerCapture(event.pointerId)
        setDragState(true)
        return
      }
      const now = performance.now()
      const next = clamp(s.off - (event.clientX - s.x))
      const dt = now - s.t
      if (dt > 0) vel.current = (next - offset.current) / dt
      offset.current = next
      apply()
      s.t = now
    }
    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = start.current
      if (event.pointerId !== s.pointerId) return
      if (dragging.current) {
        dragging.current = false
        viewportRef.current?.releasePointerCapture?.(event.pointerId)
        setDragState(false)
        swallowNextClick() // Swallow the click that would navigate.
        if (Math.abs(vel.current) >= MIN_VELOCITY) momentum()
      }
      s.pending = false
      s.pointerId = -1
    }
    const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = start.current
      if (event.pointerId !== s.pointerId) return
      // Cancel does not produce a click; just release the guard.
      dragging.current = false
      viewportRef.current?.releasePointerCapture?.(event.pointerId)
      setDragState(false)
      s.pending = false
      s.pointerId = -1
    }

    // ── Keyboard (left/right arrows) ──
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
        return
      const viewport = viewportRef.current
      if (!viewport) return
      event.preventDefault()
      stopMomentum()
      computeMax()
      setOffset(
        offset.current +
          (event.key === 'ArrowRight' ? 1 : -1) * viewport.clientWidth * KEY_STEP_RATIO
      )
    }

    // ── Reveal on focus (Tab reaches an offscreen link) ──
    const onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current
      const track = trackRef.current
      const child = event.target as HTMLElement
      if (!viewport || !track || !track.contains(child)) return
      computeMax()
      const c = child.getBoundingClientRect()
      const v = viewport.getBoundingClientRect()
      let delta = 0
      if (c.left < v.left) delta = c.left - v.left
      else if (c.right > v.right) delta = c.right - v.right
      if (delta !== 0) setOffset(offset.current + delta)
    }

    // ── Wheel/trackpad + resize: native non-passive listeners ──
    React.useEffect(() => {
      const viewport = viewportRef.current
      if (!viewport) return

      const onWheel = (event: WheelEvent) => {
        const unit =
          event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? viewport.clientWidth : 1
        let dx = event.deltaX * unit
        let dy = event.deltaY * unit
        if (event.shiftKey && dx === 0) {
          dx = dy // Shift+wheel scrolls horizontally when the browser does not convert it.
          dy = 0
        }
        if (Math.abs(dx) <= Math.abs(dy)) return // Let the page scroll for vertical intent.
        event.preventDefault() // Consume horizontal intent only.
        stopMomentum()
        computeMax()
        setOffset(offset.current + dx)
      }
      viewport.addEventListener('wheel', onWheel, { passive: false })

      const observer = new ResizeObserver(() => {
        if (!viewport.clientWidth) return // display:none: keep the current position.
        computeMax()
        setOffset(offset.current) // Clamp again against the new maximum.
      })
      observer.observe(viewport)
      if (trackRef.current) observer.observe(trackRef.current)

      return () => {
        viewport.removeEventListener('wheel', onWheel)
        observer.disconnect()
        stopMomentum()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <DragScrollerProvider trackRef={trackRef} restoredOffset={restoredOffset}>
        <Primitive.div
          {...rootProps}
          ref={composedRef}
          style={{ overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none', ...style }}
          onPointerDown={composeEventHandlers(props.onPointerDown, onPointerDown)}
          onPointerMove={composeEventHandlers(props.onPointerMove, onPointerMove)}
          onPointerUp={composeEventHandlers(props.onPointerUp, onPointerUp)}
          onPointerCancel={composeEventHandlers(props.onPointerCancel, onPointerCancel)}
          onKeyDown={composeEventHandlers(props.onKeyDown, onKeyDown)}
          onFocus={composeEventHandlers(props.onFocus, onFocus)}
          onDragStart={composeEventHandlers(props.onDragStart, (event) => event.preventDefault())}
        >
          {children}
        </Primitive.div>
      </DragScrollerProvider>
    )
  }
)
DragScrollerRoot.displayName = ROOT_NAME

const TRACK_NAME = 'DragScrollerTrack'

/** The moving row. Its position is controlled by the inline transform. */
const DragScrollerTrack = React.forwardRef<HTMLDivElement, PrimitiveDivProps>(
  (props, forwardedRef) => {
    const { style, ...trackProps } = props
    const context = useDragScrollerContext(TRACK_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.trackRef)
    return (
      <Primitive.div
        {...trackProps}
        ref={composedRef}
        style={{ transform: `translate3d(${-context.restoredOffset}px,0,0)`, ...style }}
      />
    )
  }
)
DragScrollerTrack.displayName = TRACK_NAME

/* ---------------------------------------------------------------------------------------------- */

const Root = DragScrollerRoot
const Track = DragScrollerTrack

export { DragScrollerRoot, DragScrollerTrack, Root, Track }
export type { DragScrollerRootProps, DragScrollerApi }
