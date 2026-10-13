'use client'

/**
 * Headless bottom sheet adds drag-to-dismiss to Dialog's portal, scrim, focus trap, Escape/outside dismissal, and scroll lock. Drag the handle or body downward; release beyond the distance/velocity threshold to close, otherwise spring back. Nested scrollers yield only at their top. Compose Root, Trigger, Portal, Overlay, Content, Handle, Title, and Close. Content exposes --sheet-drag in pixels, --sheet-drag-progress from 0 to 1, and data-dragging; consumer CSS controls translation and transitions. Keep the final drag offset when dismissing so the exit animation continues from it. Overlay shares progress and dragging state. Handle closes on tap and enforces touch-action: none. Other parts reuse Dialog.
 */

import * as React from 'react'

import * as DialogPrimitive from './dialog'
import { composeEventHandlers } from './internal/compose-event-handlers'
import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'
import { useControllableState } from './internal/use-controllable-state'

const ROOT_NAME = 'BottomSheet'
const DRAG_VAR = '--sheet-drag'
const PROGRESS_VAR = '--sheet-drag-progress'
/** Minimum movement in pixels distinguishing a drag from a tap or jitter. */
const DRAG_SLOP = 6
/** Maximum upward stretch in pixels. */
const OVERSHOOT = 28
/** Recent sample window in milliseconds for release velocity. */
const VELOCITY_WINDOW = 100
/** Suppress follow-up clicks after dragging for this many milliseconds. */
const CLICK_SWALLOW_MS = 350

type BottomSheetContextValue = {
  onOpenChange: (open: boolean) => void
  overlayRef: React.RefObject<HTMLDivElement | null>
  handleRef: React.RefObject<HTMLDivElement | null>
}
const [BottomSheetProvider, useBottomSheetContext] =
  createContext<BottomSheetContextValue>(ROOT_NAME)

/*
 * Root controls Dialog.Root and exposes onOpenChange through context for gesture dismissal.
 */

interface BottomSheetRootProps extends DialogPrimitive.DialogProps {}

const BottomSheetRoot: React.FC<BottomSheetRootProps> = (props) => {
  const { open: openProp, defaultOpen, onOpenChange, children, ...dialogProps } = props
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: ROOT_NAME,
  })
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const handleRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <BottomSheetProvider onOpenChange={setOpen} overlayRef={overlayRef} handleRef={handleRef}>
      <DialogPrimitive.Root {...dialogProps} open={open} onOpenChange={setOpen}>
        {children}
      </DialogPrimitive.Root>
    </BottomSheetProvider>
  )
}
BottomSheetRoot.displayName = ROOT_NAME

/*
 * Overlay receives drag progress so consumer CSS can fade the scrim.
 */

const OVERLAY_NAME = 'BottomSheetOverlay'

const BottomSheetOverlay = React.forwardRef<HTMLDivElement, DialogPrimitive.DialogOverlayProps>(
  (props, forwardedRef) => {
    const context = useBottomSheetContext(OVERLAY_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.overlayRef)
    return <DialogPrimitive.Overlay {...props} ref={composedRef} />
  }
)
BottomSheetOverlay.displayName = OVERLAY_NAME

/*
 * Content combines Dialog.Content with drag-to-dismiss.
 */

const CONTENT_NAME = 'BottomSheetContent'

interface BottomSheetContentProps extends DialogPrimitive.DialogContentProps {
  /** Close when released beyond this fraction of sheet height. Default: 0.25. */
  closeThreshold?: number
  /** Close on a downward flick faster than this velocity in px/ms, regardless of distance. Default: 0.4. */
  velocityThreshold?: number
  /**
   * Gesture area: sheet allows dragging anywhere when nested content is at the top; handle limits dragging to the grabber; false disables gestures. Default: sheet.
   */
  drag?: 'sheet' | 'handle' | false
}

const BottomSheetContent = React.forwardRef<HTMLDivElement, BottomSheetContentProps>(
  (props, forwardedRef) => {
    const {
      closeThreshold = 0.25,
      velocityThreshold = 0.4,
      drag = 'sheet',
      style,
      ...contentProps
    } = props
    const context = useBottomSheetContext(CONTENT_NAME)
    // Presence remounts content on each open; attach gestures when its callback ref receives the DOM node.
    const [content, setContent] = React.useState<HTMLDivElement | null>(null)
    const composedRef = useComposedRefs(forwardedRef, setContent)
    const closeRef = React.useRef(context.onOpenChange)
    React.useEffect(() => {
      closeRef.current = context.onOpenChange
    }, [context.onOpenChange])

    React.useEffect(() => {
      if (!content || !drag) return
      const { overlayRef, handleRef } = context

      let startX = 0
      let startY = 0
      let current = 0
      let engaged = false
      let tracking = false
      let mouseId: number | null = null
      let samples: { y: number; t: number }[] = []
      let swallowTimer = 0

      const overlay = () => overlayRef.current
      const apply = (px: number) => {
        const progress = Math.min(1, Math.max(0, px / (content.offsetHeight || 1)))
        content.style.setProperty(DRAG_VAR, `${px}px`)
        content.style.setProperty(PROGRESS_VAR, String(progress))
        overlay()?.style.setProperty(PROGRESS_VAR, String(progress))
      }
      const setDragging = (on: boolean) => {
        for (const element of [content, overlay()]) {
          if (!element) continue
          if (on) element.setAttribute('data-dragging', '')
          else element.removeAttribute('data-dragging')
        }
      }

      /** Whether this target can start a gesture. */
      const allowed = (target: EventTarget | null) => {
        const element = target as HTMLElement | null
        if (!element) return false
        if (drag === 'handle') return Boolean(handleRef.current?.contains(element))
        // Do not start over text inputs or selectors; mouse dragging must remain text selection.
        return !element.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
        )
      }
      /** Let a nested scroller between target and content consume the gesture if it can still scroll upward. */
      const yieldsToInnerScroll = (target: EventTarget | null) => {
        let element = target as HTMLElement | null
        while (element && element !== content) {
          if (element.scrollTop > 0) {
            const overflowY = getComputedStyle(element).overflowY
            if (overflowY === 'auto' || overflowY === 'scroll') return true
          }
          element = element.parentElement
        }
        return false
      }

      // Suppress the click following a drag to avoid handle dismissal or accidental child-button activation.
      const swallowNextClick = () => {
        const done = () => {
          window.clearTimeout(swallowTimer)
          content.removeEventListener('click', swallow, true)
        }
        const swallow = (event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          done()
        }
        content.addEventListener('click', swallow, true)
        swallowTimer = window.setTimeout(done, CLICK_SWALLOW_MS)
      }

      const begin = (x: number, y: number, target: EventTarget | null) => {
        if (!allowed(target)) return false
        startX = x
        startY = y
        current = 0
        engaged = false
        samples = [{ y, t: performance.now() }]
        return true
      }

      /** true requests prevention of native scrolling/bounce; cancel abandons the gesture. */
      const move = (x: number, y: number, target: EventTarget | null): boolean | 'cancel' => {
        const now = performance.now()
        samples.push({ y, t: now })
        if (samples.length > 2) samples = samples.filter((s) => now - s.t <= VELOCITY_WINDOW)
        if (!engaged) {
          const dy = y - startY
          const dx = x - startX
          if (Math.abs(dx) > DRAG_SLOP && Math.abs(dx) > Math.abs(dy)) return 'cancel' // Horizontal gesture.
          if (dy <= DRAG_SLOP) return false
          if (yieldsToInnerScroll(target)) {
            startY = y // While nested content scrolls, update the origin so sheet dragging starts at zero when it reaches the top.
            return false
          }
          engaged = true
          startY = y // Prevent a jump when the drag activates.
          setDragging(true)
          apply(0)
          return true
        }
        const dy = y - startY
        current = dy >= 0 ? dy : -OVERSHOOT * (1 - Math.exp(dy / OVERSHOOT))
        apply(current)
        return true
      }

      const end = () => {
        if (!engaged) return
        engaged = false
        const first = samples[0]
        const last = samples[samples.length - 1]
        const velocity = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0
        const height = content.offsetHeight || 1
        const flungDown = velocity > velocityThreshold
        const flungUp = velocity < -velocityThreshold
        const farEnough = current / height > closeThreshold
        swallowNextClick()
        setDragging(false)
        if (current > 0 && (flungDown || (farEnough && !flungUp))) {
          // Retain the dragged position for the exit animation to continue from it.
          closeRef.current(false)
        } else {
          apply(0)
        }
        samples = []
      }

      // Touch: use a non-passive touchmove listener to prevent native scroll and bounce.
      const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return
        tracking = begin(event.touches[0].clientX, event.touches[0].clientY, event.target)
      }
      const onTouchMove = (event: TouchEvent) => {
        if (!tracking || event.touches.length !== 1) return
        const result = move(event.touches[0].clientX, event.touches[0].clientY, event.target)
        if (result === 'cancel') tracking = false
        else if (result && event.cancelable) event.preventDefault()
      }
      const onTouchEnd = () => {
        tracking = false
        end()
      }

      // Mouse: support the same dismissal gesture on desktop.
      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        if (begin(event.clientX, event.clientY, event.target)) mouseId = event.pointerId
      }
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerId !== mouseId) return
        const wasEngaged = engaged
        const result = move(event.clientX, event.clientY, event.target)
        if (result === 'cancel') mouseId = null
        else if (result) {
          if (!wasEngaged) content.setPointerCapture(event.pointerId)
          event.preventDefault()
        }
      }
      const onPointerUp = (event: PointerEvent) => {
        if (event.pointerId !== mouseId) return
        mouseId = null
        if (content.hasPointerCapture(event.pointerId))
          content.releasePointerCapture(event.pointerId)
        end()
      }

      content.addEventListener('touchstart', onTouchStart, { passive: true })
      content.addEventListener('touchmove', onTouchMove, { passive: false })
      content.addEventListener('touchend', onTouchEnd, { passive: true })
      content.addEventListener('touchcancel', onTouchEnd, { passive: true })
      content.addEventListener('pointerdown', onPointerDown)
      content.addEventListener('pointermove', onPointerMove)
      content.addEventListener('pointerup', onPointerUp)
      content.addEventListener('pointercancel', onPointerUp)
      return () => {
        content.removeEventListener('touchstart', onTouchStart)
        content.removeEventListener('touchmove', onTouchMove)
        content.removeEventListener('touchend', onTouchEnd)
        content.removeEventListener('touchcancel', onTouchEnd)
        content.removeEventListener('pointerdown', onPointerDown)
        content.removeEventListener('pointermove', onPointerMove)
        content.removeEventListener('pointerup', onPointerUp)
        content.removeEventListener('pointercancel', onPointerUp)
        window.clearTimeout(swallowTimer)
        setDragging(false)
      }
    }, [content, drag, closeThreshold, velocityThreshold, context])

    return (
      <DialogPrimitive.Content
        {...contentProps}
        ref={composedRef}
        // Initialize variables before the first frame so utilities such as translate-y-(--sheet-drag) are valid.
        style={{ [DRAG_VAR]: '0px', [PROGRESS_VAR]: '0', ...style } as React.CSSProperties}
      />
    )
  }
)
BottomSheetContent.displayName = CONTENT_NAME

/*
 * Handle is decorative and hidden from screen readers; Close and Escape provide accessible dismissal. Tapping the handle closes the sheet.
 */

const HANDLE_NAME = 'BottomSheetHandle'

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
interface BottomSheetHandleProps extends PrimitiveDivProps {}

const BottomSheetHandle = React.forwardRef<HTMLDivElement, BottomSheetHandleProps>(
  (props, forwardedRef) => {
    const { style, ...handleProps } = props
    const context = useBottomSheetContext(HANDLE_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.handleRef)
    return (
      <Primitive.div
        aria-hidden="true"
        {...handleProps}
        ref={composedRef}
        // Prevent the browser from capturing handle scrolling so the sheet follows the first movement.
        style={{ touchAction: 'none', ...style }}
        onClick={composeEventHandlers(props.onClick, () => context.onOpenChange(false))}
      />
    )
  }
)
BottomSheetHandle.displayName = HANDLE_NAME

/* ---------------------------------------------------------------------------------------------- */

const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetPortal = DialogPrimitive.Portal
const BottomSheetTitle = DialogPrimitive.Title
const BottomSheetDescription = DialogPrimitive.Description
const BottomSheetClose = DialogPrimitive.Close

const Root = BottomSheetRoot
const Trigger = BottomSheetTrigger
const Portal = BottomSheetPortal
const Overlay = BottomSheetOverlay
const Content = BottomSheetContent
const Handle = BottomSheetHandle
const Title = BottomSheetTitle
const Description = BottomSheetDescription
const Close = BottomSheetClose

export {
  BottomSheetRoot,
  BottomSheetTrigger,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetClose,
  //
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Handle,
  Title,
  Description,
  Close,
}
export type { BottomSheetRootProps, BottomSheetContentProps, BottomSheetHandleProps }
