import * as React from 'react'

import { Textarea as TextareaPrimitive } from '@comwit/ui'
import { focusField, invalidField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <TextareaPrimitive
      className={cn(
        'flex field-sizing-content min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm placeholder:text-placeholder selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow]',
        focusField,
        invalidField,
        'disabled:cursor-not-allowed disabled:text-disabled-foreground',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
