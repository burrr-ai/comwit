'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'

// 프리미티브 없이 자립(순수 프레젠테이션). 유일 behavior 인 "더블클릭 텍스트 선택 방지"만 인라인.
type LabelProps = React.ComponentProps<'label'>

function Label({ className, onMouseDown, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-label font-semibold text-foreground select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-disabled peer-disabled:cursor-not-allowed peer-disabled:opacity-disabled peer-has-[:disabled]:cursor-not-allowed peer-has-[:disabled]:opacity-disabled',
        className
      )}
      {...props}
      onMouseDown={(event) => {
        // 라벨 안의 컨트롤 클릭이면 통과, 아니면 더블클릭 시 텍스트 선택만 막는다.
        const target = event.target as HTMLElement
        if (target.closest('button, input, select, textarea')) return
        onMouseDown?.(event)
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault()
      }}
    />
  )
}

export { Label }
export type { LabelProps }
