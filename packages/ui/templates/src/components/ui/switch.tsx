'use client'

/**
 * Switch — 토글 스위치 스타일 레이어. **동작·a11y(role="switch"·키보드·폼)** 는
 * comwit-ui `Switch`(Radix) 프리미티브가 책임지고, 여기서는 우리 토큰 + variant(size)로 **시각만** 입힌다.
 *
 *  - 트랙 = Switch.Root(<button role="switch">). 체크 색/포커스 링/비활성/사이즈.
 *  - 썸    = Switch.Thumb. checked 시 이동(translate) + 눌림 시 살짝 확대(group-active).
 *  - "켜짐" 판정은 프리미티브가 방출하는 data-state="checked" (peer-checked 대체).
 */

import * as React from 'react'
import { cva } from 'class-variance-authority'

import { Switch as SwitchPrimitive } from '@comwit/ui'
import { focusRing } from '../../lib/interaction'
import { cn } from '../../lib/utils'

// 트랙 = Root(button). group 을 달아 눌림 상태를 썸(group-active)에 전달.
const switchTrackVariants = cva(
  'group relative inline-flex shrink-0 cursor-pointer rounded-pill bg-input transition-colors duration-base data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-disabled',
  {
    variants: {
      size: {
        default: 'h-6 w-10',
        sm: 'h-5 w-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

/* 썸 색은 트랙 상태를 따라간다.
   꺼짐: --switch-thumb (항상 밝음 → 회색 트랙 위 6.6:1)
   켜짐: --primary-foreground (정의상 primary 트랙과 대비된다)
   단색 하나로는 불가능하다 — 다크에서 primary 가 near-white 로 반전되므로
   밝은 썸은 켜짐에서 1.00:1 로 사라지고, 어두운 썸은 꺼짐에서 2.48:1 로 묻힌다. */
const switchThumbVariants = cva(
  'pointer-events-none absolute left-0.5 top-0.5 rounded-pill bg-switch-thumb shadow-raised transition-transform duration-base ease-standard group-active:scale-press-thumb data-[state=checked]:bg-primary-foreground',
  {
    variants: {
      size: {
        default: 'size-5 data-[state=checked]:translate-x-4',
        sm: 'size-4 data-[state=checked]:translate-x-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

// public API 보존: Radix Switch.Root(button) props 그대로 + 우리 size 토큰.
// (checked/defaultChecked/onCheckedChange/disabled/required/name/value/id/className 모두 프리미티브가 수용)
type SwitchProps = Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, 'size'> & {
  size?: 'sm' | 'default'
}

function Switch({ className, size, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchTrackVariants({ size }), focusRing, className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
