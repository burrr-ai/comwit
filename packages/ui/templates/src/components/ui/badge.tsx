import * as React from 'react'
import { Slot } from '@comwit/ui'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

// 뱃지 = 정보 라벨. 인터랙션 없이 상태 5토큰을 옅은 surface 로 노출한다.
const badgeVariants = cva(
  cn(
    'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap',
    'rounded-pill border border-transparent px-2 py-0.5 text-micro font-semibold',
    '[&>svg]:pointer-events-none [&>svg]:size-3 [&>svg]:shrink-0'
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'bg-success-surface text-success-surface-foreground',
        warning: 'bg-warning-surface text-warning-surface-foreground',
        destructive: 'bg-destructive-surface text-destructive-surface-foreground',
        info: 'bg-info-surface text-info-surface-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
