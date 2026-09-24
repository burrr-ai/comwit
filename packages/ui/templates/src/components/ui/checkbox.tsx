'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive, useCenterRipple } from '@comwit/ui'
import { focusRing, rippleItemClassName } from '../../lib/interaction'
import { cn } from '../../lib/utils'

// onCheckedChange 는 boolean 만 흘려보낸다 (프리미티브의 indeterminate 는 호출부서 안 씀)
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
    <span className="peer relative inline-flex shrink-0">
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        disabled={disabled}
        className={cn(
          'peer relative z-raised size-5 shrink-0 cursor-pointer rounded-lg border border-input bg-background',
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
        {/* forceMount 로 항상 마운트 → data-state 로 stroke 드로우 인/아웃 애니를 구동 */}
        <CheckboxPrimitive.Indicator asChild forceMount>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'pointer-events-none absolute inset-0 z-raised m-auto size-3.5 text-primary-foreground',
              '[&>path]:[stroke-dasharray:1] [&>path]:[stroke-dashoffset:1] [&>path]:transition-[stroke-dashoffset] [&>path]:duration-slow [&>path]:ease-out',
              'data-[state=checked]:[&>path]:[stroke-dashoffset:0]'
            )}
          >
            <path pathLength={1} d="M4 12.5l5 5L20 6.5" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {/* 호버 헤일로 + 센터 리플 — 컨트롤 뒤 원형 면. 색은 currentColor 로 상태 따라 전환 */}
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
