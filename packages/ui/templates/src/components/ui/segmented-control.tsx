'use client'

import * as React from 'react'
import { cva } from 'class-variance-authority'

import { disabledStyle, focusRing, pressable } from '../../lib/interaction'
import { cn } from '../../lib/utils'

export type SegmentedOption<T extends string | null> = {
  label: React.ReactNode
  value: T
  /** 우측 작은 카운트 배지 (예: 미처리 12) */
  count?: number
}

type SegmentedControlProps<T extends string | null> = {
  options: SegmentedOption<T>[]
  value: T
  onValueChange: (value: T) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const segmentVariants = cva(
  cn(
    'inline-flex items-center gap-1.5 rounded-control border-0 text-label',
    focusRing,
    pressable,
    disabledStyle
  ),
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5',
        md: 'px-4 py-2',
      },
      active: {
        true: 'bg-card font-semibold text-foreground shadow-card',
        false: 'font-medium text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: { size: 'sm', active: false },
  }
)

/**
 * 세그먼트 컨트롤 — 들어간 회색 트랙 위에 흰 알약이 선택지를 가리킨다(토스 톤).
 * 필터·보기 전환처럼 즉시 반영되는 단일 선택에 쓴다.
 *
 * 각 칸은 독립 버튼(`aria-pressed`)이다. 그룹의 "다시 누르면 해제"와 실제 null 옵션값("All")이
 * 충돌하므로 토글 그룹 프리미티브를 쓰지 않는다.
 */
function SegmentedControl<T extends string | null>({
  options,
  value,
  onValueChange,
  disabled,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="segmented-control"
      className={cn('inline-flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value ?? '__null__')}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={segmentVariants({ size, active })}
          >
            {option.label}
            {option.count != null ? (
              <span
                className={cn(
                  'min-w-4 rounded-pill px-1 text-center text-micro font-semibold tabular-nums',
                  active ? 'bg-primary/10 text-primary' : 'bg-foreground/10 text-muted-foreground'
                )}
              >
                {option.count.toLocaleString()}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
