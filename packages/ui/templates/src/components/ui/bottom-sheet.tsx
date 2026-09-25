'use client'

/**
 * BottomSheet — 아래에서 올라오는 시트. 위의 핸들을 끌어내리면(또는 탭하면) 닫힌다.
 *
 * 동작(끌기 · 거리/속도 판정 · 안쪽 스크롤 양보 · 포커스 트랩 · ESC · 스크림)은 @comwit/ui 의 BottomSheet
 * 프리미티브가 갖고, 여기서는 유리 면 · 핸들 · 여백만 입힌다. 끌린 거리는 프리미티브가 쓰는 `--sheet-drag` 를
 * translate 로 그리고, 끄는 동안(`data-dragging`)엔 전환을 끄며, 놓으면 제자리로 돌아온다. 스크림은
 * `--sheet-drag-progress` 만큼 옅어진다. 열림·닫힘은 lib/overlay-motion 이 transform 으로 그린다 — 첫 열림부터
 * 자기 높이만큼(100%) 올라오고, 닫힐 땐(드래그로 닫혀도 끌린 자리에서 이어서) 끝까지 내려간 뒤에 사라진다.
 *
 *   <BottomSheet>
 *     <BottomSheetTrigger asChild><Button>Filters</Button></BottomSheetTrigger>
 *     <BottomSheetContent>
 *       <BottomSheetHeader>
 *         <BottomSheetTitle>Filters</BottomSheetTitle>
 *         <BottomSheetDescription>Narrow the list down.</BottomSheetDescription>
 *       </BottomSheetHeader>
 *       <div className="min-h-0 flex-1 overflow-y-auto px-5">…</div>
 *       <BottomSheetFooter><Button>Apply</Button></BottomSheetFooter>
 *     </BottomSheetContent>
 *   </BottomSheet>
 *
 * 긴 본문은 가운데 영역에 `min-h-0 flex-1 overflow-y-auto` 를 준다 — 그 스크롤이 맨 위일 때만 시트가 따라온다.
 * `container` 로 포털 대상을 바꾸면 앱 쉘(transform 이 걸린 폰 프레임 등) 안에 띄울 수 있다.
 */

import * as React from 'react'
import { BottomSheet as BottomSheetPrimitive } from '@comwit/ui'
import { XIcon } from 'lucide-react'

import { GlassSurface } from './glass'
import { OverlayMotion } from '../../lib/overlay-motion'
import { cn } from '../../lib/utils'
import { focusRing } from '../../lib/interaction'

function BottomSheet({ ...props }: React.ComponentProps<typeof BottomSheetPrimitive.Root>) {
  return <BottomSheetPrimitive.Root data-slot="bottom-sheet" {...props} />
}

function BottomSheetTrigger({
  ...props
}: React.ComponentProps<typeof BottomSheetPrimitive.Trigger>) {
  return <BottomSheetPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />
}

function BottomSheetClose({ ...props }: React.ComponentProps<typeof BottomSheetPrimitive.Close>) {
  return <BottomSheetPrimitive.Close data-slot="bottom-sheet-close" {...props} />
}

function BottomSheetPortal({ ...props }: React.ComponentProps<typeof BottomSheetPrimitive.Portal>) {
  return <BottomSheetPrimitive.Portal data-slot="bottom-sheet-portal" {...props} />
}

function BottomSheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof BottomSheetPrimitive.Overlay>) {
  return (
    <BottomSheetPrimitive.Overlay
      data-slot="bottom-sheet-overlay"
      className={cn('group/scrim fixed inset-0 z-overlay', className)}
      {...props}
      asChild
    >
      {/* 들어오고 나가는 투명도는 바깥(lib/overlay-motion)이, 끄는 동안 옅어지는 건 안쪽 면이 갖는다 — 한 속성을 둘이 잡지 않게. */}
      <OverlayMotion preset="scrim">
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 bg-overlay',
            // 끌수록 옅어진다(프리미티브가 바깥 요소에 쓰는 진행도를 물려받는다). 끄는 동안은 전환 없이 바로.
            'opacity-[calc(1-var(--sheet-drag-progress,0))] transition-opacity duration-slow group-data-[dragging]/scrim:transition-none'
          )}
        />
      </OverlayMotion>
    </BottomSheetPrimitive.Overlay>
  )
}

/** 그래버 — 프리미티브가 탭 닫기와 touch-action 을 갖고, 여기서는 바만 그린다. */
function BottomSheetHandle({
  className,
  ...props
}: React.ComponentProps<typeof BottomSheetPrimitive.Handle>) {
  return (
    <BottomSheetPrimitive.Handle
      data-slot="bottom-sheet-handle"
      className={cn(
        'flex h-7 w-full shrink-0 cursor-grab items-center justify-center active:cursor-grabbing',
        'before:h-1.5 before:w-9 before:rounded-full before:bg-foreground/20 before:transition-colors before:duration-fast hover:before:bg-foreground/35',
        className
      )}
      {...props}
    />
  )
}

type BottomSheetContentProps = React.ComponentProps<typeof BottomSheetPrimitive.Content> & {
  /** 포털 대상. 기본 body. 앱 쉘 안에 띄우려면 그 요소를 준다. */
  container?: React.ComponentProps<typeof BottomSheetPrimitive.Portal>['container']
  /** 위의 그래버. 기본 true. */
  showHandle?: boolean
  /** 우상단 ✕. 핸들이 있으니 기본 false. */
  showCloseButton?: boolean
}

function BottomSheetContent({
  className,
  children,
  container,
  showHandle = true,
  showCloseButton = false,
  ...props
}: BottomSheetContentProps) {
  return (
    <BottomSheetPortal container={container}>
      <BottomSheetOverlay />
      {/* 스크림 위의 굴절 유리(dense) — 면·보더·그림자는 .glass 가 갖는다. 바닥에 붙는 변은 보더를 걷는다. */}
      <GlassSurface variant="morphing" shape="panel" dense>
        <BottomSheetPrimitive.Content
          data-slot="bottom-sheet-content"
          className={cn(
            'fixed inset-x-0 bottom-0 z-modal mx-auto flex max-h-[calc(100%-2.5rem)] w-full max-w-lg flex-col rounded-t-sheet border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] text-popover-foreground outline-none',
            // 손가락을 따라오는 translate — 끄는 동안은 전환 없이, 놓으면 제자리로 돌아온다. 열림·닫힘은 transform 이
            // 따로 그리므로(lib/overlay-motion) 여기선 translate 만 전환한다. 드래그로 닫히면 끌린 자리에서 이어서 내려간다.
            'translate-y-(--sheet-drag) transition-[translate] duration-slower ease-[cubic-bezier(0.22,1,0.36,1)] data-[dragging]:transition-none',
            className
          )}
          {...props}
          asChild
        >
          {/* 아래 변에서 자기 높이만큼(100%) 올라오고 내려간다 */}
          <OverlayMotion preset="sheet" side="bottom">
            {showHandle ? <BottomSheetHandle /> : null}
            {children}
            {showCloseButton && (
              <BottomSheetPrimitive.Close
                data-slot="bottom-sheet-close"
                className={cn(
                  focusRing,
                  'absolute top-3 right-3 rounded-control p-1 opacity-60 transition-opacity hover:opacity-100 disabled:pointer-events-none'
                )}
              >
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </BottomSheetPrimitive.Close>
            )}
          </OverlayMotion>
        </BottomSheetPrimitive.Content>
      </GlassSurface>
    </BottomSheetPortal>
  )
}

function BottomSheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn('flex shrink-0 flex-col gap-1 px-5 pt-1 pb-3', className)}
      {...props}
    />
  )
}

function BottomSheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="bottom-sheet-footer"
      className={cn('mt-auto flex shrink-0 flex-col gap-2 px-5 pt-3 pb-5', className)}
      {...props}
    />
  )
}

function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof BottomSheetPrimitive.Title>) {
  return (
    <BottomSheetPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn('text-title-md text-foreground', className)}
      {...props}
    />
  )
}

function BottomSheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof BottomSheetPrimitive.Description>) {
  return (
    <BottomSheetPrimitive.Description
      data-slot="bottom-sheet-description"
      className={cn('text-body-sm text-soft-foreground', className)}
      {...props}
    />
  )
}

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
}
