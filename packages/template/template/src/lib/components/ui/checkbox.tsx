'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive, useCenterRipple } from '@comwit/ui'
import { focusRing, rippleItemClassName } from '@/lib/interaction'
import { cn } from '@/lib/utils/cn'

// onCheckedChange emits booleans only; consumers do not use the primitive's indeterminate state.
type CheckboxProps = Omit<
  React.ComponentProps<typeof CheckboxPrimitive.Root>,
  'onCheckedChange' | 'asChild' | 'children'
> & {
  onCheckedChange?: (checked: boolean) => void
}

function Checkbox({
  className,
  onCheckedChange,
  onPointerDown,
  disabled,
  ...props
}: CheckboxProps) {
  const { onRippleDown, ripples } = useCenterRipple(disabled, rippleItemClassName)

  return (
    <span className="peer relative inline-flex shrink-0">
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        disabled={disabled}
        className={cn(
          'peer relative z-raised size-5 shrink-0 cursor-pointer rounded-lg border border-input bg-background',
          'transition-[background-color,border-color] duration-base',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
          focusRing,
          'disabled:cursor-not-allowed disabled:opacity-disabled',
          className
        )}
        onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
        onPointerDown={(event) => {
          onRippleDown()
          onPointerDown?.(event)
        }}
        {...props}
      >
        {/* Always mount with forceMount so data-state can drive stroke draw-in/draw-out animations. */}
        <CheckboxPrimitive.Indicator asChild forceMount>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'pointer-events-none absolute inset-0 z-raised m-auto size-3.5 text-primary-foreground',
              '[&>path]:[stroke-dasharray:1] [&>path]:[stroke-dashoffset:1] [&>path]:transition-[stroke-dashoffset] [&>path]:duration-slow [&>path]:ease-out',
              'data-[state=checked]:[&>path]:[stroke-dashoffset:0]'
            )}
          >
            <path pathLength={1} d="M4 12.5l5 5L20 6.5" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {/* Hover halo and centered ripple behind the control. currentColor follows state changes. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-2 rounded-pill text-foreground transition-colors duration-base',
          'peer-hover:state-hover-layer peer-data-[state=checked]:text-primary peer-data-[state=checked]:peer-hover:state-selected-layer peer-disabled:hidden'
        )}
      >
        {ripples}
      </span>
    </span>
  )
}

export { Checkbox }
