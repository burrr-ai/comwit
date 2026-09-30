'use client'

import { cn } from '@/lib/utils'

type AdminListRowProps = {
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

/**
 * 어드민 리스트 한 줄 — 헤어라인 보더 카드 행.
 * 멤버/시드유저/프로젝트 등 `flex justify-between rounded border p-3` 반복을 흡수.
 * 구현체 = 헤어라인 보더 카드 표면 div. 룩(보더/라운드/카드섀도)은 Tailwind 토큰으로 유지.
 */
export function AdminListRow({ className, onClick, children }: AdminListRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-card',
        onClick &&
          'cursor-pointer transition-shadow hover:shadow-card-hover',
        className,
      )}
    >
      {children}
    </div>
  )
}
