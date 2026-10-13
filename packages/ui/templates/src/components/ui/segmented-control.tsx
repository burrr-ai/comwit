'use client'

import * as React from 'react'
import { cva } from 'class-variance-authority'

import { disabledStyle, focusRing, pressable } from '../../lib/interaction'
import { cn } from '../../lib/utils'

export type SegmentedOption<T extends string | null> = {
  label: React.ReactNode
  value: T
  /** Small count badge on the right, such as 12 pending items. */
  count?: number
}

type SegmentedControlProps<T extends string | null> = {
  options: SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const segmentVariants = cva(
  cn(
    'inline-flex items-center gap-1.5 rounded-control border-0 text-label',
    focusRing,
    pressable,
    disabledStyle
  ),
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5',
        md: 'px-4 py-2',
      },
      active: {
        true: 'bg-card font-semibold text-foreground shadow-card',
        false: 'font-medium text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: { size: 'sm', active: false },
  }
)

/**
 * Segmented control: a white pill marks the selection on an inset gray track, inspired by Toss.
 * Use for single selections that apply immediately, such as filters and view switches.
 *
 * Each segment is an independent aria-pressed button. A toggle group's press-again-to-clear behavior would
 * conflict with an actual null option value ("All"), so this does not use the toggle-group primitive.
 */
function SegmentedControl<T extends string | null>({
  options,
  value,
  onValueChange,
  disabled,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="segmented-control"
      className={cn('inline-flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value ?? '__null__')}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={segmentVariants({ size, active })}
          >
            {option.label}
            {option.count != null ? (
              <span
                className={cn(
                  'min-w-4 rounded-pill px-1 text-center text-micro font-semibold tabular-nums',
                  active ? 'bg-primary/10 text-primary' : 'bg-foreground/10 text-muted-foreground'
                )}
              >
                {option.count.toLocaleString()}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
