'use client'

import type { LucideIcon } from 'lucide-react'
import { adminCardRaised } from '@/services/admin/_components/styles'
import { cn } from '@/lib/utils'

type AdminSectionProps = {
  title: string
  icon?: LucideIcon
  description?: React.ReactNode
  action?: React.ReactNode
  /** 헤더 우측 인라인 보조 텍스트 (예: "누적 1시간 30분") */
  meta?: React.ReactNode
  className?: string
  /** 본문 패딩 제거(리스트/테이블을 카드 가장자리까지 붙일 때) */
  flush?: boolean
  children?: React.ReactNode
}

/**
 * 어드민 카드 섹션 — Toss 톤(화이트 표면 + 헤어라인 보더 + 큰 라운드).
 * 헤더는 (아이콘? + 제목 + description?) | meta? | action? 구조.
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
