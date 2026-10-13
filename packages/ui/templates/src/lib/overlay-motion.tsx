'use client'

/**
 * Overlay motion — entry/exit for dropdowns, popovers, selects, dialogs, sheets, and bottom sheets.
 *
 * The @comwit/ui usePresenceAnimation engine springs progress t (0 = closed, 1 = open) and plays it through
 * the native Web Animations API. Runs from the first opening, keeps exiting parts until the spring settles,
 * and preserves position/velocity on reversal. This file contains only style(t) and spring values.
 * Render as the part's asChild child so its ref, data-*, handlers, and className reach this element unchanged.
 *
 *   <PopoverPrimitive.Content asChild className="…">
 *     <OverlayMotion preset="menu">{children}</OverlayMotion>
 *   </PopoverPrimitive.Content>
 *
 * - menu: dropdowns, popovers, selects. Grows from scale 0.6 at the trigger transform-origin, translating 0.5rem
 *   from the side opposite data-side. Slight bounce; exits along the same path.
 * - dialog: centered dialog, growing from scale 0.9.
 * - sheet: travels its full size (100%) toward the attached side. No bounce, to stay flush with the edge.
 * - scrim: overlay opacity only.
 *
 * Springs use { duration (perceived seconds), bounce (0 = no overshoot) }. Edit only PRESETS below to tune them.
 * Animate transform and opacity only. Position parts with individual properties such as translate to avoid
 * conflicts. translate3d keeps the glass backdrop-filter on a compositing layer so WebKit retains its backdrop during motion.
 */

import * as React from 'react'
import { usePresenceAnimation, type PresenceAnimationOptions } from '@comwit/ui'

export type OverlayMotionPreset = 'menu' | 'dialog' | 'sheet' | 'scrim'
export type OverlayMotionSide = 'top' | 'right' | 'bottom' | 'left'

const clamp = (t: number) => Math.min(1, Math.max(0, t))
/** Opacity fills before motion completes, avoiding a translucent ghost while the part grows. */
const fadeIn = (t: number) => clamp(t * 1.5)

/** Menu offset from the side opposite its placement, in rem: [x, y]. */
const MENU_FROM: Record<OverlayMotionSide, [number, number]> = {
  bottom: [0, -0.5],
  top: [0, 0.5],
  left: [0.5, 0],
  right: [-0.5, 0],
}

/** Sheet exit direction as a signed percentage of its own size: [x, y]. */
const SHEET_FROM: Record<OverlayMotionSide, [number, number]> = {
  bottom: [0, 100],
  top: [0, -100],
  left: [-100, 0],
  right: [100, 0],
}

type Preset = Omit<PresenceAnimationOptions, 'onExitComplete'>

const PRESETS: Record<OverlayMotionPreset, (side: OverlayMotionSide | undefined) => Preset> = {
  menu: (side) => {
    const [x, y] = side ? MENU_FROM[side] : [0, 0]
    return {
      style: (t) => ({
        opacity: fadeIn(t),
        transform: `translate3d(${x * (1 - t)}rem, ${y * (1 - t)}rem, 0) scale(${0.6 + 0.4 * t})`,
      }),
      enter: { duration: 0.27, bounce: 0.12 },
      exit: { duration: 0.17 },
    }
  },
  dialog: () => ({
    style: (t) => ({
      opacity: fadeIn(t),
      transform: `translate3d(0, 0, 0) scale(${0.9 + 0.1 * t})`,
    }),
    enter: { duration: 0.27, bounce: 0.08 },
    exit: { duration: 0.16 },
  }),
  sheet: (side = 'bottom') => {
    const [x, y] = SHEET_FROM[side]
    return {
      style: (t) => {
        const hidden = 1 - clamp(t)
        return { transform: `translate3d(${x * hidden}%, ${y * hidden}%, 0)` }
      },
      enter: { duration: 0.35 },
      exit: { duration: 0.21 },
    }
  },
  scrim: () => ({
    style: (t) => ({ opacity: clamp(t) }),
    enter: { duration: 0.3 },
    exit: { duration: 0.21 },
  }),
}

type OverlayMotionProps = React.ComponentPropsWithoutRef<'div'> & {
  preset: OverlayMotionPreset
  /** Attached edge for sheets, placement side for menus. Defaults to the part's data-side. */
  side?: OverlayMotionSide
  /** Called after the exit animation finishes, just before the part disappears. */
  onExitComplete?: () => void
}

const OverlayMotion = React.forwardRef<HTMLDivElement, OverlayMotionProps>(function OverlayMotion(
  { preset, side, onExitComplete, style, ...props },
  forwardedRef
) {
  const placed = side ?? ((props as Record<string, unknown>)['data-side'] as OverlayMotionSide)
  const animate = usePresenceAnimation<HTMLDivElement>({
    ...PRESETS[preset](placed),
    onExitComplete,
  })
  // Combine the part ref (focus, outside clicks, Presence) and animation ref on one element with a stable callback.
  const forwarded = React.useRef(forwardedRef)
  forwarded.current = forwardedRef
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      animate(node)
      const target = forwarded.current
      if (typeof target === 'function') target(node)
      else if (target) target.current = node
    },
    [animate]
  )

  return <div ref={ref} {...props} style={{ backfaceVisibility: 'hidden', ...style }} />
})

export { OverlayMotion }
