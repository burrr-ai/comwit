'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { Button as ButtonPrimitive } from '@comwit/ui'
import { disabledStyle, focusRing, pressable } from '@/lib/interaction'
import { cn } from '@/lib/utils/cn'

/**
 * Control box shared by surfaced variants: radius, type scale, and weight. plain does not receive these styles.
 */
const controlBox = 'rounded-pill text-label font-semibold'

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none shrink-0',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    focusRing,
    pressable,
    disabledStyle
  ),
  {
    variants: {
      variant: {
        default: `${controlBox} bg-primary text-primary-foreground hover:bg-primary-strong`,
        destructive: `${controlBox} bg-destructive text-destructive-foreground hover:bg-destructive-strong`,
        outline: `${controlBox} border border-input bg-background hover:bg-accent hover:text-accent-foreground`,
        secondary: `${controlBox} bg-secondary text-secondary-foreground hover:bg-accent`,
        ghost: `${controlBox} hover:bg-accent hover:text-accent-foreground`,
        link: `${controlBox} text-primary underline-offset-4 hover:underline`,
        /**
         * No appearance: enforces no radius, type scale, weight, or color.
         * Use when migrating a native button that already owns all its styling.
         * Only shared focus-ring, pressed-state, and disabled behavior are added, preserving the existing appearance.
         */
        plain: '',
      },
      size: {
        sm: 'h-8 px-3',
        default: 'h-9 px-4',
        lg: 'h-10 px-6',
        icon: 'size-9',
        /**
         * The caller owns height and padding; pair with plain.
         */
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Remove caller-supplied transition-* classes.
 *
 * Button owns transitions through pressable: colors, borders, shadows, and transform. If a caller supplies
 * transition-colors, tailwind-merge keeps it, omitting transform and making the pressed scale jump.
 * Keep duration-* and ease-* so callers can still choose timing and curves.
 */
function stripTransition(className?: string) {
  if (!className) return className
  return className
    .split(/\s+/)
    .filter((token) => !token.slice(token.lastIndexOf(':') + 1).startsWith('transition'))
    .join(' ')
}

/**
 * The comwit-ui Button primitive owns disabled, type, and asChild behavior; this layer supplies visuals only.
 *
 * No ripple. pressable alone provides a subtle scale on press with immediate feedback. Removing the ripple's
 * required overflow:hidden also prevents clipping underlines, rings, and badges.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  return (
    <ButtonPrimitive
      asChild={asChild}
      disableRipple
      className={cn(buttonVariants({ variant, size, className: stripTransition(className) }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
