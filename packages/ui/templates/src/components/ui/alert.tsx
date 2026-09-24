import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/* 콜아웃 = 옅은 surface 배경 + 같은 계열 진한 텍스트 + border (카탈로그 CALLOUTS 톤과 일치) */
const alertVariants = cva(
  'relative flex items-start gap-3 rounded-lg border p-4 text-body-sm [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:translate-y-0.5',
  {
    variants: {
      tone: {
        default: 'border-border bg-card text-foreground',
        success: 'border-success-border bg-success-surface text-success-surface-foreground',
        warning: 'border-warning-border bg-warning-surface text-warning-surface-foreground',
        destructive:
          'border-destructive-border bg-destructive-surface text-destructive-surface-foreground',
        info: 'border-info-border bg-info-surface text-info-surface-foreground',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  }
)

function Alert({
  className,
  tone,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('text-title-sm', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('text-body-sm', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
