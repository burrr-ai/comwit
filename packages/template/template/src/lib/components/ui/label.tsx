'use client'

import * as React from 'react'

import { cn } from '@/lib/utils/cn'

// Self-contained presentation without a primitive. Its only behavior, preventing double-click text selection, is inline.
type LabelProps = React.ComponentProps<'label'>

function Label({ className, onMouseDown, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-label font-semibold text-foreground select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-disabled peer-disabled:cursor-not-allowed peer-disabled:opacity-disabled peer-has-[:disabled]:cursor-not-allowed peer-has-[:disabled]:opacity-disabled',
        className
      )}
      {...props}
      onMouseDown={(event) => {
        // Allow clicks on controls inside the label; otherwise prevent only double-click text selection.
        const target = event.target as HTMLElement
        if (target.closest('button, input, select, textarea')) return
        onMouseDown?.(event)
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault()
      }}
    />
  )
}

export { Label }
export type { LabelProps }
