'use client'

import { ForesightLink as Link } from '@/lib/components/foresight-link'
import { ArrowLeftIcon } from '@comwit/ui/icons'

type AdminPageHeaderProps = {
  title: string
  description?: React.ReactNode
  /** When set, show a back-to-list text link above the title. */
  backHref?: string
  backLabel?: string
  /** Supporting content beside the title, such as a badge. */
  badge?: React.ReactNode
  /** Action area on the right. */
  action?: React.ReactNode
}

/**
 * Toss-inspired admin page header.
 * When backHref is set, show a small back-to-list link above the title.
 */
export function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel = '목록으로',
  badge,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-label font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        ) : null}
        <div className="flex items-center gap-2.5">
          <h1 className="text-display-md font-bold">{title}</h1>
          {badge}
        </div>
        {description ? (
          <p className="mt-1.5 text-body-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
