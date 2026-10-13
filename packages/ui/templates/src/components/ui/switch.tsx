'use client'

import * as React from 'react'
import { cva } from 'class-variance-authority'

import { Switch as SwitchPrimitive } from '@comwit/ui'
import { focusRing } from '../../lib/interaction'
import { cn } from '../../lib/utils'

// Track = Root(button). Named group/switch passes the pressed state to the thumb without colliding with an outer .group.
const switchTrackVariants = cva(
  'group/switch relative inline-flex shrink-0 cursor-pointer rounded-pill bg-input transition-colors duration-base data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-disabled',
  {
    variants: {
      size: {
        default: 'h-6 w-10',
        sm: 'h-5 w-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

/*
 * Thumb color follows track state: off always uses the light --switch-thumb; on uses --primary-foreground
 * for contrast with primary. A single color would blend into one track state in dark mode.
 */
const switchThumbVariants = cva(
  'pointer-events-none absolute left-0.5 top-0.5 rounded-pill bg-switch-thumb shadow-raised transition-transform duration-base ease-out group-active/switch:scale-press-thumb data-[state=checked]:bg-primary-foreground',
  {
    variants: {
      size: {
        default: 'size-5 data-[state=checked]:translate-x-4',
        sm: 'size-4 data-[state=checked]:translate-x-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

// size is our token variant; Omit prevents a collision with the primitive button size.
type SwitchProps = Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, 'size'> & {
  size?: 'sm' | 'default'
}

function Switch({ className, size, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchTrackVariants({ size }), focusRing, className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
