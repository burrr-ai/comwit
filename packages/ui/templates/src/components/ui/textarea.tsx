import * as React from 'react'

import { Textarea as TextareaPrimitive } from '@comwit/ui'
import { disabledStyle, focusField, invalidField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

/** Field skin: minimum height, automatic growth, border, radius, and padding. bare does not receive these styles. */
const fieldSkin = 'field-sizing-content min-h-24 rounded-control border border-input px-3 py-2'

// The @comwit/ui Textarea primitive owns accessibility and Korean IME behavior. This layer applies Comwit visual tokens only.
function Textarea({
  className,
  bare = false,
  ...props
}: React.ComponentProps<'textarea'> & {
  /**
   * Remove the field skin (minimum height, automatic growth, border, radius, padding) and focus ring.
   * For composers that size by rows or calculate height themselves: min-h-24 (96px) would override rows,
   * and field-sizing-content would conflict with manual resizing. IME handling, selection color, invalid,
   * and disabled states remain available.
   */
  bare?: boolean
}) {
  return (
    <TextareaPrimitive
      data-slot="textarea"
      className={cn(
        'flex w-full bg-transparent text-body-sm placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow]',
        !bare && fieldSkin,
        !bare && focusField,
        invalidField,
        disabledStyle,
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
