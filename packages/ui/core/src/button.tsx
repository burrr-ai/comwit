'use client'

/**
 * Headless button adds press/ripple behavior, disabled handling, and a default type to a native button. Consumers own color/size styling. The primitive wires useRipple, positions/clips ripple spans, and chains the consumer pointer handler after the ripple handler. Pass rippleClassName for visible ripple styling. asChild delegates through Slot, disabling ripple and omitting disabled because arbitrary hosts may not support either. disableRipple turns off only ripple behavior. type defaults to button to avoid accidental form submission. Forward ref as a React 19 prop to the native button or Slot child.
 */

import * as React from 'react'
import { Slot } from './slot'
import { useRipple } from './utils/ripple'

/** Inline structural styles required by ripple: positioning and overflow clipping. */
const RIPPLE_HOST_STYLE: React.CSSProperties = { position: 'relative', overflow: 'hidden' }

type ButtonProps = React.ComponentProps<'button'> & {
  /** Delegate behavior to a Slot child; omit ripple and disabled with asChild. */
  asChild?: boolean
  /** Disable ripple, for example on link-style buttons. Always disabled with asChild. */
  disableRipple?: boolean
  /** Consumer-provided ripple color, shape, and animation classes; no default in the headless engine. */
  rippleClassName?: string
}

function Button({
  asChild = false,
  disableRipple = false,
  rippleClassName,
  className,
  disabled,
  style,
  onPointerDown,
  children,
  ...props
}: ButtonProps) {
  // Always call the ripple hook before branching to preserve hook order; it remains unused for asChild.
  const { onRippleDown, ripples } = useRipple(disabled, rippleClassName)

  // Disable ripple for asChild because an arbitrary host cannot guarantee its structure.
  const withRipple = !asChild && !disableRipple

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={className}
        style={style}
        {...props}
        onPointerDown={onPointerDown}
      >
        {children}
      </Slot>
    )
  }

  return (
    <button
      data-slot="button"
      type="button"
      className={className}
      style={withRipple ? { ...RIPPLE_HOST_STYLE, ...style } : style}
      disabled={disabled}
      {...props}
      onPointerDown={(e) => {
        if (withRipple) onRippleDown(e)
        onPointerDown?.(e)
      }}
    >
      {withRipple ? ripples : null}
      {children}
    </button>
  )
}

export { Button }
export type { ButtonProps }
