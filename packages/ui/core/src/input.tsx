'use client'

/**
 * comwit-ui — bare input primitive (MUI InputBase equivalent, unstyled and app-independent).
 *
 * A minimal native input wrapper that owns behavior and state only. The consumer layer, lib/components/ui,
 * applies token styles such as color, size, and borders with cva.
 *
 * - IME-safe (including Korean composition): exposes composition status through data-composing.
 *   Between compositionstart and compositionend, onChange may emit incomplete characters. Consumers can
 *   defer value transforms, validation, and formatting until composition ends, using data-composing as a hook.
 *   For example, inspect e.currentTarget.dataset.composing in onChange or style the composing state with CSS.
 *   Consumer onCompositionStart/End handlers are chained and never swallowed.
 * - asChild: Slot merges behavior and attributes into the child (for example, a text-field Control wrapping this Input).
 * - ref: accepts ref as a prop following React 19 and forwards it to the native input or Slot child.
 *
 * CSS/JS state hook: data-composing is "true" only during composition.
 */

import * as React from 'react'
import { Slot } from './slot'

type InputProps = React.ComponentProps<'input'> & {
  /** Render the child element and merge behavior and attributes through Slot. */
  asChild?: boolean
}

function Input({ asChild = false, onCompositionStart, onCompositionEnd, ...props }: InputProps) {
  // Composition state comes only from events, independently of autofill/controlled values (no ref access, so react-hooks/refs-safe).
  const [isComposing, setComposing] = React.useState(false)

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    setComposing(true)
    onCompositionStart?.(e)
  }
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setComposing(false)
    onCompositionEnd?.(e)
  }

  const Comp = asChild ? Slot : 'input'

  return (
    <Comp
      data-slot="input"
      data-composing={isComposing ? 'true' : undefined}
      {...props}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  )
}

export { Input }
export type { InputProps }
