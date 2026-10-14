'use client'

import type { IconComponent } from '@comwit/ui/icons'
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@comwit/ui/icons'
import { ForesightLink as Link } from '@/lib/components/foresight-link'
import { Skeleton } from '@/lib/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AdminSparkline } from './admin-charts'

type AdminStatCardProps = {
  label: string
  value: number | string
  icon?: IconComponent
  loading?: boolean
  /** Emphasize risk, such as pending reports, with the danger tone. */
  emphasis?: boolean
  /** Supporting description below the value. */
  hint?: string
  /** Change from the comparison period: positive rises (emerald), negative falls (muted). */
  delta?: number
  /** Label beside delta, e.g. "vs. yesterday". */
  deltaLabel?: string
  /** Mini sparkline data. */
  spark?: number[]
  /** Make the entire card a link. */
  href?: string
}

/**
 * Admin KPI card: label, large value, optional icon, delta chip, and sparkline.
 * Shared from dashboard StatCard for member, report, and coffee-chat summaries.
 */
export function AdminStatCard({
  label,
  value,
  icon: Icon,
  loading,
  emphasis,
  hint,
  delta,
  deltaLabel,
  spark,
  href,
}: AdminStatCardProps) {
  const body = (
    <div
      className={cn(
        'flex h-full flex-col rounded-card border p-5 shadow-card transition-shadow',
        emphasis
          ? 'border-destructive-surface-foreground/30 bg-card'
          : 'border-border bg-card',
        href && 'hover:shadow-card-hover',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-label text-muted-foreground">{label}</p>
        {Icon ? (
          <div
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
              emphasis
                ? 'bg-destructive-surface text-destructive-surface-foreground'
                : 'bg-secondary text-muted-foreground',
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="mt-2 h-8 w-20 rounded-md" />
      ) : (
        <p
          className={cn(
            'mt-2 text-display-md leading-none font-bold tabular-nums',
            emphasis ? 'text-destructive-surface-foreground' : 'text-foreground',
          )}
        >
          {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
        </p>
      )}

      {(delta != null || hint) && !loading ? (
        <div className="mt-2 flex items-center gap-1.5 text-caption">
          {delta != null ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold tabular-nums',
                delta > 0
                  ? 'text-success-surface-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {delta > 0 ? (
                <ArrowUpRightIcon className="h-3 w-3" />
              ) : delta < 0 ? (
                <ArrowDownRightIcon className="h-3 w-3" />
              ) : null}
              {delta > 0 ? '+' : ''}
              {delta.toLocaleString('ko-KR')}
            </span>
          ) : null}
          {deltaLabel || hint ? (
            <span className="text-muted-foreground">{deltaLabel ?? hint}</span>
          ) : null}
        </div>
      ) : null}

      {spark && spark.length > 1 && !loading ? (
        <div className="mt-auto pt-3">
          <AdminSparkline
            data={spark}
            className={emphasis ? 'text-destructive-surface-foreground' : 'text-primary'}
          />
        </div>
      ) : null}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    )
  }
  return body
}

/** Inline section-header stat chip combining a label and value. */
export function AdminStatChip({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-lg bg-secondary px-2.5 py-1">
      <span className="text-caption font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-label font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </span>
  )
}
