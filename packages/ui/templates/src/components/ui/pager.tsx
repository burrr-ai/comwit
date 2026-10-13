'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@comwit/ui/icons'

import { disabledStyle, focusRing, pressable } from '../../lib/interaction'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

type PagerProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
  /** When true, show a disabled pager (‹ 1 ›) even with zero or one page. */
  alwaysShow?: boolean
  labels?: {
    nav?: string
    previous?: string
    next?: string
    /** Accessible name for a numbered button, defaulting to "Page 3". */
    page?: (page: number) => string
  }
}

/**
 * Numbered pagination with previous/next controls and a pill highlighting the current page.
 * Show all pages when total ≤ 7; otherwise show 1 … current-1 current current+1 … last.
 * Requires only page/totalPages, unlike manually assembled shadcn-style Pagination markup.
 */
function Pager({ page, totalPages, onChange, className, alwaysShow = false, labels }: PagerProps) {
  if (totalPages <= 1 && !alwaysShow) return null

  const text = {
    nav: uiText.pager.nav,
    previous: uiText.pager.previous,
    next: uiText.pager.next,
    page: uiText.pager.page,
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
        <ChevronLeftIcon className="size-4" aria-hidden="true" />
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
        <ChevronRightIcon className="size-4" aria-hidden="true" />
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

/** Page numbers: all when total ≤ 7; otherwise 1 … current±1 … last. */
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
