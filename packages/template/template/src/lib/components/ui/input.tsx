import * as React from 'react'

import { Input as InputPrimitive } from '@comwit/ui'
import { disabledStyle, focusField, invalidField } from '@/lib/interaction'
import { cn } from '@/lib/utils/cn'

/**
 * Field skin: height, border, radius, and horizontal padding. bare does not receive these styles.
 */
const fieldSkin = 'h-9 rounded-control border border-input px-3'

// The @comwit/ui Input primitive owns accessibility and Korean IME composition: data-composing, asChild, and ref forwarding.
// This layer applies Comwit visual tokens only. The public API remains the native input API.
function Input({
  className,
  type,
  bare = false,
  ...props
}: React.ComponentProps<'input'> & {
  /**
   * Remove the field skin (height, border, radius, padding) and focus ring.
   * For inputs inside already styled containers, such as popover search rows, inline pill editors, or title
   * fields. Adding a skin there would introduce unwanted borders/height and duplicate rings.
   * IME handling, selection color, invalid, and disabled states remain available.
   */
  bare?: boolean
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'w-full min-w-0 bg-transparent text-body-sm placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow]',
        !bare && fieldSkin,
        !bare && focusField,
        invalidField,
        disabledStyle,
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-body-sm file:font-semibold file:text-foreground',
        className
      )}
      {...props}
    />
  )
}

export { Input }
