'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { useRipple } from '@comwit/ui'
import { disabledStyle, focusRing, pressable, rippleItemClassName } from '../../lib/interaction'
import { cn } from '../../lib/utils'

const chipVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-pill select-none shrink-0',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0'
  ),
  {
    variants: {
      variant: {
        filled: '',
        tonal: '',
        outline: 'border bg-transparent',
      },
      tone: {
        neutral: '',
        primary: '',
        success: '',
        warning: '',
        destructive: '',
        info: '',
      },
      size: {
        sm: 'h-6 px-2.5 text-caption',
        md: 'h-8 px-3 text-body-sm',
      },
    },
    compoundVariants: [
      // filled — 진한 면 + 흰 글자 (neutral 은 먹색 면)
      { variant: 'filled', tone: 'neutral', class: 'bg-foreground text-background' },
      { variant: 'filled', tone: 'primary', class: 'bg-primary text-primary-foreground' },
      { variant: 'filled', tone: 'success', class: 'bg-success text-success-foreground' },
      { variant: 'filled', tone: 'warning', class: 'bg-warning text-warning-foreground' },
      {
        variant: 'filled',
        tone: 'destructive',
        class: 'bg-destructive text-destructive-foreground',
      },
      { variant: 'filled', tone: 'info', class: 'bg-info text-info-foreground' },
      // tonal — 옅은 면 + tone 글자
      { variant: 'tonal', tone: 'neutral', class: 'bg-muted text-foreground' },
      { variant: 'tonal', tone: 'primary', class: 'bg-primary/10 text-primary' },
      {
        variant: 'tonal',
        tone: 'success',
        class: 'bg-success-surface text-success-surface-foreground',
      },
      {
        variant: 'tonal',
        tone: 'warning',
        class: 'bg-warning-surface text-warning-surface-foreground',
      },
      {
        variant: 'tonal',
        tone: 'destructive',
        class: 'bg-destructive-surface text-destructive-surface-foreground',
      },
      { variant: 'tonal', tone: 'info', class: 'bg-info-surface text-info-surface-foreground' },
      // outline — 옅은 보더 + tone 글자
      { variant: 'outline', tone: 'neutral', class: 'border-border text-foreground' },
      { variant: 'outline', tone: 'primary', class: 'border-primary/40 text-primary' },
      {
        variant: 'outline',
        tone: 'success',
        class: 'border-success-border text-success-surface-foreground',
      },
      {
        variant: 'outline',
        tone: 'warning',
        class: 'border-warning-border text-warning-surface-foreground',
      },
      {
        variant: 'outline',
        tone: 'destructive',
        class: 'border-destructive-border text-destructive-surface-foreground',
      },
      {
        variant: 'outline',
        tone: 'info',
        class: 'border-info-border text-info-surface-foreground',
      },
    ],
    defaultVariants: {
      variant: 'tonal',
      tone: 'neutral',
      size: 'md',
    },
  }
)

/** selected 상태 강조 — data-selected 로 tone/variant 색을 덮는다. */
const selectedStyle =
  'data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-transparent'

/** 클릭 가능한 칩의 인터랙션 룩 — 리플 호스트 + 눌림 + 포커스 링. */
const clickableStyle = cn(
  'relative overflow-hidden cursor-pointer',
  focusRing,
  pressable,
  disabledStyle
)

interface ChipProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof chipVariants> {
  /** 선택 상태 — aria-pressed + data-selected 로 강조된다. */
  selected?: boolean
  /** 삭제 콜백 — 있으면 우측에 X 삭제 버튼이 붙는다. */
  onDelete?: () => void
  disabled?: boolean
}

function Chip({
  className,
  variant,
  tone,
  size,
  selected,
  onClick,
  onDelete,
  disabled,
  onPointerDown,
  children,
  ...props
}: ChipProps) {
  const clickable = onClick != null
  const { onRippleDown, ripples } = useRipple(disabled, rippleItemClassName)

  const rootClassName = cn(
    chipVariants({ variant, tone, size }),
    clickable && clickableStyle,
    selectedStyle,
    className
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (clickable) onRippleDown(e)
    onPointerDown?.(e)
  }

  const sharedProps = {
    'data-slot': 'chip',
    'data-selected': selected === undefined ? undefined : selected,
    'aria-pressed': selected === undefined ? undefined : selected,
    className: rootClassName,
    onClick,
    onPointerDown: handlePointerDown,
  }

  const content = (
    <>
      {clickable ? ripples : null}
      {children}
    </>
  )

  if (onDelete) {
    return (
      <div {...sharedProps} aria-disabled={disabled || undefined} {...props}>
        {content}
        <button
          type="button"
          aria-label="삭제"
          disabled={disabled}
          className={cn(
            '-mr-1 inline-flex items-center justify-center rounded-pill p-0.5',
            'hover:bg-current/10 transition-colors',
            focusRing,
            disabledStyle
          )}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  if (clickable) {
    return (
      <button type="button" disabled={disabled} {...sharedProps} {...props}>
        {content}
      </button>
    )
  }

  return (
    <span {...sharedProps} {...props}>
      {children}
    </span>
  )
}

export { Chip, chipVariants }
