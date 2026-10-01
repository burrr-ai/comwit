'use client'

import { ForesightLink as Link } from '@/lib/components/foresight-link'
import { ArrowLeft } from 'lucide-react'

type AdminPageHeaderProps = {
  title: string
  description?: React.ReactNode
  /** 설정 시 "목록으로" 텍스트 링크가 타이틀 위에 표시됨 */
  backHref?: string
  backLabel?: string
  /** 타이틀 우측에 표시할 보조 요소 (배지 등) */
  badge?: React.ReactNode
  /** 우측 액션 영역 */
  action?: React.ReactNode
}

/**
 * 어드민 페이지 상단 헤더 — Toss 톤.
 * backHref가 있으면 타이틀 위에 작은 "← 목록으로" 링크를 둔다.
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
            <ArrowLeft className="h-3.5 w-3.5" />
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
