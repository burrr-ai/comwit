import * as React from 'react'

import { cn } from '../../lib/utils'

type SeparatorProps = React.ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical'
  /** true(기본): 장식용 → 스크린리더 무시. false: 의미 있는 구분(role=separator). */
  decorative?: boolean
}

// 동작이 없어 프리미티브 없이 자립. role/aria-orientation 만 파생한다.
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  // separator role 의 암묵 기본이 horizontal 이라 vertical 일 때만 명시.
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
        'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  )
}

export { Separator }
export type { SeparatorProps }
