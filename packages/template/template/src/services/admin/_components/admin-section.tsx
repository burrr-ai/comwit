'use client'

import type { IconComponent } from '@comwit/ui/icons'
import { adminCardRaised } from '@/services/admin/_components/styles'
import { cn } from '@/lib/utils'

type AdminSectionProps = {
  title: string
  icon?: IconComponent
  description?: React.ReactNode
  action?: React.ReactNode
  /** Inline supporting text beside the header, such as accumulated duration. */
  meta?: React.ReactNode
  className?: string
  /** Remove content padding so lists/tables reach the card edges. */
  flush?: boolean
  children?: React.ReactNode
}

/**
 * Toss-inspired admin card section: white surface, hairline border, large radius.
 * Header structure: optional icon + title + optional description | meta | action.
 */
export function AdminSection({
  title,
  icon: Icon,
  description,
  action,
  meta,
  className,
  flush,
  children,
}: AdminSectionProps) {
  return (
    <section
      className={cn(
        adminCardRaised,
        flush ? 'overflow-hidden' : 'p-5 sm:p-6',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-3',
          flush && 'px-5 pt-5 sm:px-6',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : null}
            <h2 className="text-title-sm">{title}</h2>
          </div>
          {description ? (
            <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? (
          <div className="shrink-0 text-label text-foreground">{meta}</div>
        ) : null}
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children != null ? (
        <div className={cn(flush ? 'mt-4' : 'mt-4 space-y-4')}>{children}</div>
      ) : null}
    </section>
  )
}
