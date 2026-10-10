'use client'

import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react'
import { Icon } from './icon'
import { bake } from './motion'
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
    let animations: { animation: Animation; settle: number }[] = []
    const stop = () => {
      animations.forEach(({ animation }) => animation.cancel())
      animations = []
    }
    const play = () => {
      if (reduced.matches || typeof element.animate !== 'function') return
      // Restarting mid-gesture would snap parts back to rest; once only the tail is left, it can't show.
      const busy = animations.some(
        ({ animation, settle }) =>
          animation.playState === 'running' && Number(animation.currentTime ?? 0) < settle
      )
      if (busy) return
      stop()
      const parts = new Map<string, SVGElement>()
      element
        .querySelectorAll<SVGElement>('[data-icon-part]')
        .forEach((node) => parts.set(node.dataset.iconPart!, node))
      animations = definition.motion.flatMap((track) => {
        const part = parts.get(track.part)
        if (!part) return []
        const { keyframes, duration, settle } = bake(track)
        const animation = part.animate(keyframes, { duration, easing: 'linear', fill: 'none' })
        return [{ animation, settle }]
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
