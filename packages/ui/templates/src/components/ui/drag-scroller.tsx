'use client'

/**
 * DragScroller — 마우스·트랙패드·터치·키보드로 미는 가로 레일. 탭은 그대로 클릭된다.
 *
 * 동작(드래그·플릭 관성·휠·←/→·포커스 진입·위치 보존)은 @comwit/ui 의 DragScroller 프리미티브가 갖는다.
 * 여기서는 커서·간격만 입힌다. 드래그 중엔 프리미티브가 `data-state="dragging"` 을 단다.
 *
 *   <DragScroller ref={api} trackClassName="gap-3 px-4">
 *     {tiles}
 *   </DragScroller>
 *   api.current?.scrollByAmount(320)   // 화살표 버튼
 */

import * as React from 'react'
import { DragScroller as DragScrollerPrimitive } from '@comwit/ui'

import { cn } from '../../lib/utils'

export type DragScrollerHandle =
  React.ComponentProps<typeof DragScrollerPrimitive.Root> extends {
    apiRef?: React.Ref<infer T>
  }
    ? T
    : never

type DragScrollerProps = Omit<
  React.ComponentProps<typeof DragScrollerPrimitive.Root>,
  'apiRef' | 'ref'
> & {
  /** 트랙(아이템 줄)의 className — gap·padding 등. */
  trackClassName?: string
  /** 명령형 API(`scrollByAmount`). 뷰포트 DOM 이 필요하면 `viewportRef`. */
  ref?: React.Ref<DragScrollerHandle>
  viewportRef?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}

function DragScroller({
  trackClassName,
  className,
  ref,
  viewportRef,
  children,
  ...props
}: DragScrollerProps) {
  return (
    <DragScrollerPrimitive.Root
      ref={viewportRef}
      apiRef={ref}
      data-slot="drag-scroller"
      className={cn(
        'cursor-grab overscroll-x-contain data-[state=dragging]:cursor-grabbing',
        className
      )}
      {...props}
    >
      <DragScrollerPrimitive.Track
        data-slot="drag-scroller-track"
        className={cn('flex w-max', trackClassName)}
      >
        {children}
      </DragScrollerPrimitive.Track>
    </DragScrollerPrimitive.Root>
  )
}

export { DragScroller }
