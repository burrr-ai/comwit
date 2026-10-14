'use client'

/**
 * comwit-ui — headless usePresenceAnimation with no library dependencies.
 *
 * Animates entry/exit of overlay parts (Dialog, Popover, DropdownMenu, Select, and BottomSheet Content/Overlay)
 * with springs played through the browser's Web Animations API (element.animate). Runs from the first opening;
 * Presence keeps closing parts mounted until the exit spring settles. Only this hook is public; integration and playback are internal.
 *
 *   const ref = usePresenceAnimation<HTMLDivElement>({
 *     // Progress t: 0 = closed, 1 = open. The spring moves t; each frame's style becomes a keyframe.
 *     style: (t) => ({ opacity: t, transform: `scale(${0.6 + 0.4 * t})` }),
 *     enter: { duration: 0.28, bounce: 0.1 },
 *     exit: { duration: 0.2 },
 *   })
 *   <Popover.Content asChild><div ref={ref}>…</div></Popover.Content>
 *
 * - Sample spring progress at 60fps and pass the samples as keyframes; the compositor handles playback.
 * - On a direction change, read the current frame's position and velocity and resample toward the opposite target.
 *   Continuous velocity prevents hesitation when reopening during exit.
 * - WAAPI chooses the start time (pending play), beginning when the first frame is actually painted. Transform and
 *   opacity run on the compositor, remaining smooth when the main thread is busy (for example, generating a lens map). No separate frame loop.
 * - Keep the final appearance with fill: both; place the part using individual properties such as translate.
 * - Consumers (templates) own styles and spring values; this engine supplies neither.
 */

import * as React from 'react'

import { usePresenceExit } from './internal/presence'
import {
  sampleSpring,
  simulateSpring,
  type SpringConfig,
  type SpringFrame,
} from './internal/spring'
import { useLayoutEffect } from './internal/use-layout-effect'

interface PresenceAnimationOptions {
  /** Style at progress t (0 = closed, 1 = open). A bouncing spring may briefly push t above 1. */
  style: (t: number) => Keyframe
  /** Enter spring. Defaults to { duration: 0.28 }. */
  enter?: SpringConfig
  /** Exit spring. Defaults to { duration: 0.2 }. */
  exit?: SpringConfig
  /** Called just before the part disappears after exit settles (for example, overlay-kit unmount). */
  onExitComplete?: () => void
}

const ENTER: SpringConfig = { duration: 0.28 }
const EXIT: SpringConfig = { duration: 0.2 }

type Run = { animation: Animation; frames: SpringFrame[] }

function usePresenceAnimation<T extends Element = HTMLElement>(
  options: PresenceAnimationOptions
): React.RefCallback<T> {
  const { present, onExitComplete } = usePresenceExit()
  const [node, setNode] = React.useState<T | null>(null)
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const exitRef = React.useRef(onExitComplete)
  exitRef.current = onExitComplete
  const runRef = React.useRef<Run | null>(null)

  // Start during layout so the closed appearance is applied before the first paint, avoiding a flash.
  useLayoutEffect(() => {
    const finishExit = () => {
      optionsRef.current.onExitComplete?.()
      exitRef.current()
    }
    if (!node || typeof node.animate !== 'function') {
      if (node && !present) finishExit()
      return
    }
    const { style, enter = ENTER, exit = EXIT } = optionsRef.current
    const target = present ? 1 : 0

    // Current progress and velocity: begin closed on first entry, or continue from the active animation.
    const previous = runRef.current
    let from = { position: 0, velocity: 0 }
    if (previous) {
      from = sampleSpring(previous.frames, Number(previous.animation.currentTime ?? 0))
      previous.animation.cancel()
    }

    const frames = simulateSpring(present ? enter : exit, from.position, target, from.velocity)
    const total = frames[frames.length - 1]!.time
    const keyframes = frames.map((frame) => ({
      ...style(frame.position),
      offset: frame.time / total,
    }))
    const animation = node.animate(keyframes, { duration: total, easing: 'linear', fill: 'both' })
    runRef.current = { animation, frames }

    if (!present) {
      animation.finished.then(
        () => {
          if (runRef.current?.animation === animation) finishExit()
        },
        () => {} // Canceled because the part reopened; the new playback takes over.
      )
    }
  }, [node, present])

  return setNode as React.RefCallback<T>
}

export { usePresenceAnimation }
export type { PresenceAnimationOptions, SpringConfig }
