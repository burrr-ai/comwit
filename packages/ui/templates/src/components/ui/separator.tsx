'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'

// 순수 프레젠테이션(디자인 토큰) — behavior 가 없어 core 프리미티브 없이 자립.
// role/aria-orientation 만 파생한다(구 @comwit/ui Separator 의미론 이식).
type SeparatorProps = React.ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical'
  /** true(기본): 장식용 → 스크린리더 무시(role=none). false: 의미 있는 구분(role=separator). */
  decorative?: boolean
}

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  // separator role 의 암묵 기본은 horizontal 이므로 vertical 일 때만 명시.
  const semantic = decorative
    ? { role: 'none' as const }
    : {
        role: 'separator' as const,
        'aria-orientation': orientation === 'vertical' ? ('vertical' as const) : undefined,
      }
  return (
    <div
      data-slot="separator"
      data-orientation={orientation}
      {...semantic}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  )
}

export { Separator }
export type { SeparatorProps }
