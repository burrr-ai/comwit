'use client'

/**
 * comwit-ui — unstyled, app-independent textarea primitive wrapping a native textarea.
 *
 * Owns IME composition state for multiline input, including Korean composition. Radix has no textarea,
 * so this follows the same custom primitive approach as button/input.
 *
 * - Tracks composition and exposes data-composing. Consumers and CSS can detect composition and guard
 *   keyboard handlers such as Enter-to-submit with e.nativeEvent.isComposing or data-composing.
 * - Composes consumer onCompositionStart/End handlers instead of overwriting them.
 * - CSS field-sizing: content owns autosizing; the primitive does not control height.
 * - asChild delegates behavior to another element through Slot. React 19 ref is passed as a prop.
 *
 * The consumer layer (lib/components/ui) supplies color, size, and border tokens.
 * Consumer CSS hook: data-composing.
 */

import * as React from 'react'
import { Slot } from './slot'

type TextareaProps = React.ComponentProps<'textarea'> & {
  /** Delegate textarea behavior to the child, which owns its styles and structure. */
  asChild?: boolean
}

function Textarea({ asChild, onCompositionStart, onCompositionEnd, ...props }: TextareaProps) {
  const [isComposing, setComposing] = React.useState(false)

  const handleCompositionStart: React.CompositionEventHandler<HTMLTextAreaElement> = (e) => {
    setComposing(true)
    onCompositionStart?.(e)
  }
  const handleCompositionEnd: React.CompositionEventHandler<HTMLTextAreaElement> = (e) => {
    setComposing(false)
    onCompositionEnd?.(e)
  }

  const Comp = asChild ? Slot : 'textarea'

  return (
    <Comp
      data-slot="textarea"
      {...props}
      data-composing={isComposing ? 'true' : undefined}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  )
}

export { Textarea }
export type { TextareaProps }
