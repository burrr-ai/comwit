'use client'

import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react'
import { Icon } from './icon'
import type { AnimatedIconProps, IconDefinition } from './types'

export const AnimatedIcon = forwardRef<
  SVGSVGElement,
  AnimatedIconProps & { definition: IconDefinition }
>(function AnimatedIcon({ definition, animateOn = 'hover', replayKey, ...props }, forwardedRef) {
  const svg = useRef<SVGSVGElement>(null)
  const playRef = useRef<() => void>(() => {})
  useImperativeHandle(forwardedRef, () => svg.current!, [])

  useEffect(() => {
    const element = svg.current
    if (!element) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animations: Animation[] = []
    const stop = () => {
      animations.forEach((animation) => animation.cancel())
      animations = []
    }
    const play = () => {
      stop()
      if (reduced.matches || typeof element.animate !== 'function') return
      animations = definition.motion.flatMap((track) => {
        const part = Array.from(element.querySelectorAll<SVGElement>('[data-icon-part]')).find(
          (node) => node.dataset.iconPart === track.part
        )
        if (!part) return []
        return [
          part.animate(track.keyframes, {
            duration: track.duration ?? 560,
            delay: track.delay ?? 0,
            easing: track.easing ?? 'cubic-bezier(.22, 1, .36, 1)',
            iterations: 1,
            fill: 'none',
          }),
        ]
      })
    }
    playRef.current = play
    const trigger = element.closest<HTMLElement>('[data-icon-trigger]') ?? element
    const onFocus = (event: Event) => {
      const from = (event as FocusEvent).relatedTarget
      if (!(from instanceof Node) || !trigger.contains(from)) play()
    }
    if (animateOn === 'hover') {
      trigger.addEventListener('pointerenter', play)
      trigger.addEventListener('focusin', onFocus)
    } else if (animateOn === 'click') {
      trigger.addEventListener('click', play)
    } else if (animateOn === 'mount') play()
    const onReducedMotion = () => {
      if (reduced.matches) stop()
    }
    reduced.addEventListener('change', onReducedMotion)
    return () => {
      stop()
      playRef.current = () => {}
      trigger.removeEventListener('pointerenter', play)
      trigger.removeEventListener('focusin', onFocus)
      trigger.removeEventListener('click', play)
      reduced.removeEventListener('change', onReducedMotion)
    }
  }, [definition, animateOn])

  const previousReplayKey = useRef(replayKey)
  useEffect(() => {
    if (previousReplayKey.current !== replayKey) {
      previousReplayKey.current = replayKey
      playRef.current()
    }
  }, [replayKey])

  // Render through the pure SVG helper directly so refs work in React 18 and 19.
  return Icon({ definition, ...props, ref: svg })
})

export function createAnimatedIcon(definition: IconDefinition) {
  const Component = forwardRef<SVGSVGElement, AnimatedIconProps>((props, ref) => (
    <AnimatedIcon definition={definition} {...props} ref={ref} />
  ))
  Component.displayName = `Animated${definition.name}Icon`
  return Component
}
