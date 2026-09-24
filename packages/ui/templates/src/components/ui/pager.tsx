'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { disabledStyle, focusRing, pressable } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type PagerProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
  /** true 면 페이지가 1개(또는 0개)여도 비활성 페이저(‹ 1 ›)를 미리 노출한다. */
  alwaysShow?: boolean
  labels?: {
    nav?: string
    previous?: string
    next?: string
    /** 번호 버튼의 접근성 이름 — 기본 "Page 3" */
    page?: (page: number) => string
  }
}

/**
 * 번호 페이지네이션 — 좌우 이동 + 번호 알약(현재 강조).
 * 전체 ≤ 7 이면 모두, 그 외엔 `1 … current-1 current current+1 … last`.
 * (마크업을 직접 조립하는 shadcn 식 Pagination 과 달리 page/totalPages 만 주면 끝난다.)
 */
function Pager({ page, totalPages, onChange, className, alwaysShow = false, labels }: PagerProps) {
  if (totalPages <= 1 && !alwaysShow) return null

  const text = {
    nav: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    page: (p: number) => `Page ${p}`,
    ...labels,
  }
  const total = Math.max(1, totalPages)
  const current = Math.min(Math.max(1, page), total)
  const pages = computePages(current, total)

  return (
    <nav
      data-slot="pager"
      aria-label={text.nav}
      className={cn('flex items-center justify-center gap-1.5 py-4', className)}
    >
      <PageButton
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        aria-label={text.previous}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </PageButton>
      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`ellipsis-${i}`}
            aria-hidden="true"
            className="px-2 text-label text-muted-foreground"
          >
            …
          </span>
        ) : (
          <PageButton
            key={p}
            active={p === current}
            onClick={() => onChange(p)}
            aria-label={text.page(p)}
          >
            {p}
          </PageButton>
        )
      )}
      <PageButton
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
        aria-label={text.next}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </PageButton>
    </nav>
  )
}

function PageButton({
  active,
  className,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-pill px-3 text-body-sm font-semibold tabular-nums',
        focusRing,
        pressable,
        disabledStyle,
        active
          ? 'bg-primary text-primary-foreground hover:bg-primary-strong'
          : 'text-foreground hover:bg-muted disabled:text-subtle-foreground',
        className
      )}
      {...props}
    />
  )
}

/** 번호 리스트 — 전체 ≤ 7: 모두 · 그 외: 1 … current±1 … last */
function computePages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  if (current > 3) out.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i += 1) out.push(i)
  if (current < total - 2) out.push('…')
  out.push(total)
  return out
}

export { Pager }
