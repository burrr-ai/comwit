'use client'

import { cn } from '@/lib/utils'

type AdminChartCardProps = {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  /** 범례 — 라벨 + 색(점) */
  legend?: { label: string; color: string }[]
  className?: string
  children: React.ReactNode
}

/**
 * 어드민 차트 카드 — elevated 표면 + (제목/설명 | action) 헤더 + 범례 + 차트 본문.
 * 대시보드 추이/분포 차트를 일관된 카드에 담는다.
 */
export function AdminChartCard({
  title,
  description,
  action,
  legend,
  className,
  children,
}: AdminChartCardProps) {
  return (
    <section
      className={cn(
        'rounded-card border border-border bg-card p-5 shadow-card sm:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {legend && legend.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {legend.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 text-caption text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4">{children}</div>
    </section>
  )
}
