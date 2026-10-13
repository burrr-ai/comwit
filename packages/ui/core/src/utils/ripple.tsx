'use client'

import * as React from 'react'

type RippleItem = { key: number; x: number; y: number; size: number }

let rippleId = 0

/** Ripple container: positioning and overflow only, inheriting the host border-radius. No visuals. */
const RIPPLE_CONTAINER_STYLE: React.CSSProperties = {
  pointerEvents: 'none',
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  borderRadius: 'inherit',
}

/** Centered ripple item for useCenterRipple: fills the container without coordinate calculations. */
const CENTER_ITEM_STYLE: React.CSSProperties = { position: 'absolute', inset: 0 }

/**
 * Ripple expanding from the pressed point (comwit-ui/utils interaction primitive).
 *
 * Headless: owns position, size, and cleanup timing only. Consumers (templates) supply color, shape, and animation
 * through itemClassName, such as animate-ripple rounded-full bg-current opacity-0. Without those styles,
 * positions are calculated but nothing is visible. The host requires position: relative; overflow: hidden.
 *
 * @example
 * const { onRippleDown, ripples } = useRipple(disabled, 'animate-ripple rounded-full bg-current opacity-0')
 * <button onPointerDown={onRippleDown} style={{ position: 'relative', overflow: 'hidden' }}>
 *   {ripples}
 *   {children}
 * </button>
 */
export function useRipple(disabled?: boolean, itemClassName?: string) {
  const [items, setItems] = React.useState<RippleItem[]>([])

  const onRippleDown = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled) return
      const rect = e.currentTarget.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      setItems((prev) => [
        ...prev,
        {
          key: rippleId++,
          x: e.clientX - rect.left - size / 2,
          y: e.clientY - rect.top - size / 2,
          size,
        },
      ])
    },
    [disabled]
  )

  const remove = React.useCallback((key: number) => {
    setItems((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const ripples = (
    <span aria-hidden style={RIPPLE_CONTAINER_STYLE}>
      {items.map((r) => (
        <span
          key={r.key}
          onAnimationEnd={() => remove(r.key)}
          className={itemClassName}
          style={{ position: 'absolute', left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </span>
  )

  return { onRippleDown, ripples }
}

/**
 * Centered ripple for halos around small controls such as checkboxes and radio buttons.
 * Render ripples inside a circular halo container; they expand to fill it exactly. Without coordinate
 * calculations, this works at any container size. itemClassName follows {@link useRipple}: consumers
 * always supply the color, shape, and animation for this headless primitive.
 */
export function useCenterRipple(disabled?: boolean, itemClassName?: string) {
  const [items, setItems] = React.useState<number[]>([])

  const onRippleDown = React.useCallback(() => {
    if (disabled) return
    setItems((prev) => [...prev, rippleId++])
  }, [disabled])

  const remove = React.useCallback((key: number) => {
    setItems((prev) => prev.filter((k) => k !== key))
  }, [])

  const ripples = (
    <span aria-hidden style={RIPPLE_CONTAINER_STYLE}>
      {items.map((k) => (
        <span
          key={k}
          onAnimationEnd={() => remove(k)}
          className={itemClassName}
          style={CENTER_ITEM_STYLE}
        />
      ))}
    </span>
  )

  return { onRippleDown, ripples }
}
