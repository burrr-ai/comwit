'use client'

import * as React from 'react'
import { Dialog as SheetPrimitive } from '@comwit/ui'
import { XIcon } from 'lucide-react'

import { GlassSurface } from './glass'
import { OverlayMotion } from '../../lib/overlay-motion'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'
import { focusRing } from '../../lib/interaction'

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn('fixed inset-0 z-overlay bg-overlay', className)}
      {...props}
      asChild
    >
      <OverlayMotion preset="scrim" />
    </SheetPrimitive.Overlay>
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      {/* 스크림 위의 굴절 유리(dense) — 면·보더·그림자는 .glass 가 갖는다. 화면 가장자리에 붙는 변은 보더를 걷는다. */}
      <GlassSurface variant="morphing" shape="panel" dense>
        <SheetPrimitive.Content
          data-slot="sheet-content"
          data-side={side}
          className={cn(
            'text-popover-foreground fixed z-modal flex flex-col gap-4',
            side === 'right' && 'inset-y-0 right-0 h-full w-3/4 border-y-0 border-r-0 sm:max-w-sm',
            side === 'left' && 'inset-y-0 left-0 h-full w-3/4 border-y-0 border-l-0 sm:max-w-sm',
            side === 'top' && 'inset-x-0 top-0 h-auto rounded-b-sheet border-x-0 border-t-0',
            // 바텀시트: 아래에서 올라오므로 윗모서리만 rounded-sheet
            side === 'bottom' && 'inset-x-0 bottom-0 h-auto rounded-t-sheet border-x-0 border-b-0',
            className
          )}
          {...props}
          asChild
        >
          {/* 붙은 변 쪽으로 자기 크기만큼(100%) 들어오고 나간다 — lib/overlay-motion */}
          <OverlayMotion preset="sheet" side={side}>
            {children}
            {showCloseButton && (
              <SheetPrimitive.Close
                data-slot="sheet-close"
                className={cn(
                  focusRing,
                  'absolute top-4 right-4 rounded-control p-1 opacity-60 transition-opacity hover:opacity-100 disabled:pointer-events-none'
                )}
              >
                <XIcon className="size-4" />
                <span className="sr-only">{uiText.close}</span>
              </SheetPrimitive.Close>
            )}
          </OverlayMotion>
        </SheetPrimitive.Content>
      </GlassSurface>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-title-md text-foreground', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-body-sm text-soft-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
