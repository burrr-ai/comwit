'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { useRipple } from '@comwit/ui'
import { disabledStyle, focusRing, pressable, rippleItemClassName } from '../../lib/interaction'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'

// 칩 = 필터·태그·선택. tone×variant 색은 compoundVariants 에서, 인터랙션은 아래 훅에서.
const chipVariants = cva(
  cn(
    'inline-flex shrink-0 select-none items-center justify-center gap-1 whitespace-nowrap rounded-pill font-semibold',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0'
  ),
  {
    variants: {
      variant: {
        solid: '',
        soft: '',
        outline: 'border bg-transparent',
      },
      tone: {
        neutral: '',
        brand: '',
        success: '',
        warning: '',
        destructive: '',
        info: '',
      },
      size: {
        sm: 'h-6 px-2.5 text-caption',
        md: 'h-8 px-3 text-body-sm',
        lg: 'h-9 px-4 text-body-sm',
      },
    },
    compoundVariants: [
      // solid — 진한 면 + 대비 글자 (neutral 은 먹색)
      { variant: 'solid', tone: 'neutral', class: 'bg-foreground text-background' },
      { variant: 'solid', tone: 'brand', class: 'bg-primary text-primary-foreground' },
      { variant: 'solid', tone: 'success', class: 'bg-success text-success-foreground' },
      { variant: 'solid', tone: 'warning', class: 'bg-warning text-warning-foreground' },
      {
        variant: 'solid',
        tone: 'destructive',
        class: 'bg-destructive text-destructive-foreground',
      },
      { variant: 'solid', tone: 'info', class: 'bg-info text-info-foreground' },
      // soft — 옅은 surface 면 + 계열 글자
      { variant: 'soft', tone: 'neutral', class: 'bg-secondary text-secondary-foreground' },
      { variant: 'soft', tone: 'brand', class: 'bg-primary-surface text-primary' },
      {
        variant: 'soft',
        tone: 'success',
        class: 'bg-success-surface text-success-surface-foreground',
      },
      {
        variant: 'soft',
        tone: 'warning',
        class: 'bg-warning-surface text-warning-surface-foreground',
      },
      {
        variant: 'soft',
        tone: 'destructive',
        class: 'bg-destructive-surface text-destructive-surface-foreground',
      },
      { variant: 'soft', tone: 'info', class: 'bg-info-surface text-info-surface-foreground' },
      // outline — 계열 보더 + 계열 글자
      { variant: 'outline', tone: 'neutral', class: 'border-border text-foreground' },
      { variant: 'outline', tone: 'brand', class: 'border-primary/40 text-primary' },
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
      variant: 'soft',
      tone: 'neutral',
      size: 'md',
    },
  }
)

// selected — data-selected 로 tone/variant 색을 브랜드로 덮는다.
const selectedStyle = cn(
  'data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
  'data-[selected=true]:border-transparent'
)

// 클릭 가능한 칩 — 리플 호스트 + 눌림 + 포커스 링.
const clickableStyle = cn(
  'relative cursor-pointer overflow-hidden',
  focusRing,
  pressable,
  disabledStyle
)

interface ChipProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof chipVariants> {
  // 선택 상태 — aria-pressed + data-selected 로 강조된다.
  selected?: boolean
  // 삭제 콜백 — 있으면 우측에 X 삭제 버튼이 붙는다.
  onDelete?: () => void
  // 삭제 버튼의 접근성 이름.
  deleteLabel?: string
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
  deleteLabel = uiText.chip.remove,
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
    // 삭제 가능한 칩은 바깥이 <div> 라 disabled: 변형이 안 먹는다 — aria-disabled 로 같은 표현을 준다.
    'aria-disabled:pointer-events-none aria-disabled:opacity-disabled',
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
    // 클릭도 되는 삭제 칩 — 바깥 <div> 가 버튼 역할을 하도록 role·포커스·Enter/Space 를 준다.
    const interactive = clickable && !disabled
    return (
      <div
        {...sharedProps}
        role={clickable ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if (!interactive || e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.currentTarget.click()
          }
        }}
        {...props}
      >
        {content}
        <button
          type="button"
          aria-label={deleteLabel}
          disabled={disabled}
          className={cn(
            '-mr-1 inline-flex items-center justify-center rounded-pill p-0.5',
            'transition-colors duration-fast hover:bg-current/10',
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
