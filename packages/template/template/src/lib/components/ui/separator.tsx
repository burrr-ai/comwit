import * as React from 'react'

import { cn } from '@/lib/utils/cn'

type SeparatorProps = React.ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical'
  /**
   * True (default): decorative and ignored by screen readers. False: meaningful separator with role=separator.
   */
  decorative?: boolean
}

// No behavior requiring a primitive; derive only role and aria-orientation.
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  // The separator role defaults to horizontal, so specify orientation only for vertical separators.
  const semantic = decorative
    ? { role: 'none' as const }
    : {
        role: 'separator' as const,
        'aria-orientation': orientation === 'vertical' ? ('vertical' as const) : undefined,
      }
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      {...semantic}
      className={cn(
        'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  )
}

export { Separator }
export type { SeparatorProps }
