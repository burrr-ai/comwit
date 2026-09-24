'use client'

/**
 * Checkbox — 체크박스 스타일 레이어. **동작·a11y 는 comwit-ui `Checkbox` 프리미티브
 * (radix, button[role=checkbox] + Indicator)가 책임**지고, 여기서는 우리 토큰 + 인터랙션
 * (체크 stroke-draw 애니 · 헤일로 · 센터 리플 · focusRing)으로 **시각만** 입힌다.
 * 상태는 프리미티브가 방출하는 data-state(checked/unchecked)로 구동한다.
 */

import * as React from 'react'
import { Checkbox as CheckboxPrimitive, useCenterRipple } from '@comwit/ui'
import { focusRing, rippleItemClassName } from '../../lib/interaction'
import { cn } from '../../lib/utils'

type CheckboxProps = Omit<
  React.ComponentProps<typeof CheckboxPrimitive.Root>,
  'onCheckedChange' | 'asChild' | 'children'
> & {
  onCheckedChange?: (checked: boolean) => void
}

function Checkbox({
  className,
  onCheckedChange,
  onPointerDown,
  disabled,
  ...props
}: CheckboxProps) {
  const { onRippleDown, ripples } = useCenterRipple(disabled, rippleItemClassName)

  return (
    <span className="relative inline-flex shrink-0">
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        disabled={disabled}
        className={cn(
          'peer relative z-raised size-5 shrink-0 cursor-pointer rounded-xs border border-input bg-transparent',
          'transition-[background-color,border-color] duration-base',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
          focusRing,
          'disabled:cursor-not-allowed disabled:opacity-disabled',
          className
        )}
        onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
        onPointerDown={(event) => {
          onRippleDown()
          onPointerDown?.(event)
        }}
        {...props}
      >
        {/* 체크 표시 — pathLength 기반 stroke 드로우. Indicator(asChild+forceMount)가 data-state 를 svg 로 넘겨 애니를 구동 */}
        <CheckboxPrimitive.Indicator asChild forceMount>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'pointer-events-none absolute inset-0 z-raised m-auto size-3.5 text-primary-foreground',
              '[&>path]:[stroke-dasharray:1] [&>path]:[stroke-dashoffset:1] [&>path]:transition-[stroke-dashoffset] [&>path]:duration-slow [&>path]:ease-standard',
              'data-[state=checked]:[&>path]:[stroke-dashoffset:0]'
            )}
          >
            <path pathLength={1} d="M4 12.5l5 5L20 6.5" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {/* 호버 헤일로 + 센터 리플 — 컨트롤 뒤 원형. 리플 색은 currentColor */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-2 rounded-pill text-foreground transition-colors duration-base',
          'peer-hover:state-hover-layer peer-data-[state=checked]:text-primary peer-data-[state=checked]:peer-hover:state-selected-layer peer-disabled:hidden'
        )}
      >
        {ripples}
      </span>
    </span>
  )
}

export { Checkbox }
