import * as React from 'react'

import { focusWithinField } from '../../lib/interaction'
import { cn } from '../../lib/utils'

/**
 * Container wrapping Input with a prefix/suffix such as an icon or unit label.
 * Neutralizes the inner Input border/focus ring and displays focus on this container.
 *
 * <InputGroup>
 *   <InputAddon><SearchIcon /></InputAddon>
 *   <Input placeholder="Search" />
 * </InputGroup>
 */
function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        'flex h-9 w-full items-center rounded-control border border-input bg-transparent transition-[border-color,box-shadow]',
        focusWithinField,
        'has-[input:disabled]:opacity-disabled has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20',
        // The inner Input delegates chrome to the container and disables its own border/ring.
        '[&_[data-slot=input]]:h-full [&_[data-slot=input]]:flex-1 [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:focus-visible:ring-0 [&_[data-slot=input]]:focus-visible:border-transparent',
        className
      )}
      {...props}
    />
  )
}

// Slot for supplementary elements such as icons and unit labels inside InputGroup.
function InputAddon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="input-addon"
      className={cn(
        'flex shrink-0 items-center gap-1 px-3 text-body-sm text-muted-foreground [&_svg]:size-4',
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputAddon }
