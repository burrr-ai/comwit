'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { Button as ButtonPrimitive } from '@comwit/ui'
import { disabledStyle, focusRing, pressable, rippleItemClassName } from '../../lib/interaction'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  cn(
    'relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-label select-none shrink-0',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    focusRing,
    pressable,
    disabledStyle
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'border border-input bg-transparent hover:bg-accent/60',
        ghost: 'hover:bg-accent',
        link: 'overflow-visible text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3',
        default: 'h-10 px-4',
        lg: 'h-11 px-6',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// 동작(press/ripple·disabled·type·asChild)은 comwit-ui `Button` 프리미티브가 소유하고,
// 여기서는 cva 토큰으로 시각만 입힌다. link 는 밑줄이 잘리면 안 되고 리플도 두지 않으므로 리플을 끈다.
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
      disableRipple={variant === 'link'}
      rippleClassName={rippleItemClassName}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
