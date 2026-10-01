'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { ForesightLink as Link } from '@/lib/components/foresight-link'
import { Skeleton } from '@/lib/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AdminSparkline } from './admin-charts'

type AdminStatCardProps = {
  label: string
  value: number | string
  icon?: LucideIcon
  loading?: boolean
  /** 위험 강조(미처리 신고 등) — danger 톤 */
  emphasis?: boolean
  /** 값 아래 보조 설명 */
  hint?: string
  /** 기간 대비 증감 — 양수=상승(emerald), 음수=하락(muted) */
  delta?: number
  /** delta 옆 라벨 (예: '어제 대비') */
  deltaLabel?: string
  /** 미니 스파크라인 데이터 */
  spark?: number[]
  /** 카드 전체를 링크로 */
  href?: string
}

/**
 * 어드민 KPI 카드 — 라벨 + 큰 수치 + (아이콘·증감칩·스파크라인).
 * dashboard 로컬 StatCard를 _components로 승격해 회원/신고/커피챗 요약행과 공유.
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
                <ArrowUpRight className="h-3 w-3" />
              ) : delta < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
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

/** 섹션 헤더 인라인 통계칩 — '라벨 값' 한 덩어리. */
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
