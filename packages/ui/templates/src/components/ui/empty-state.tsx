import * as React from 'react'

import { cn } from '../../lib/utils'

type EmptyStateProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  /** Large emoji or icon. */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** Call-to-action slot, usually a single Button. */
  action?: React.ReactNode
}

/**
 * Empty state: subtle borderless surface, large emoji, one-line copy, supporting description, and a CTA.
 * Suggest just one next action when a list is empty.
 */
function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl bg-muted px-8 py-16 text-center',
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="text-[44px] leading-none text-muted-foreground grayscale-[0.2] [&_svg]:size-11"
        >
          {icon}
        </div>
      ) : null}
      <h3 className="text-title-lg text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-md text-body-sm text-soft-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-3 flex items-center gap-2">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
