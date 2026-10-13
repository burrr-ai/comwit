'use client'

/**
 * DragScroller — horizontal rail supporting mouse, trackpad, touch, and keyboard; taps remain clicks.
 *
 * The @comwit/ui DragScroller primitive owns drag, flick inertia, wheel, left/right arrows, focus visibility,
 * and position preservation. This layer adds only cursor styling and spacing. The primitive sets
 * data-state="dragging" during a drag.
 *
 *   <DragScroller ref={api} trackClassName="gap-3 px-4">
 *     {tiles}
 *   </DragScroller>
 *   api.current?.scrollByAmount(320)   // Arrow button.
 */

import * as React from 'react'
import { DragScroller as DragScrollerPrimitive } from '@comwit/ui'

import { cn } from '@/lib/utils/cn'

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
  /**
   * Track (item row) className for gap, padding, and similar styles.
   */
  trackClassName?: string
  /**
   * Imperative API (scrollByAmount). Use viewportRef to access the viewport DOM element.
   */
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
