'use client'

import * as React from 'react'
import { Dialog as SheetPrimitive } from '@comwit/ui'
import { XIcon } from '@comwit/ui/icons'

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
  closeLabel = uiText.close,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
  /** Accessible name for the close button; defaults to the project locale. */
  closeLabel?: string
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      {/* Dense refractive glass above the scrim: .glass owns surface, border, and shadow. Remove borders on edges attached to the viewport. */}
      <GlassSurface variant="morphing" shape="panel" dense>
        <SheetPrimitive.Content
          data-slot="sheet-content"
          data-side={side}
          className={cn(
            'text-popover-foreground fixed z-modal flex flex-col gap-4',
            side === 'right' && 'inset-y-0 right-0 h-full w-3/4 border-y-0 border-r-0 sm:max-w-sm',
            side === 'left' && 'inset-y-0 left-0 h-full w-3/4 border-y-0 border-l-0 sm:max-w-sm',
            side === 'top' && 'inset-x-0 top-0 h-auto rounded-b-sheet border-x-0 border-t-0',
            // Bottom sheet rises from below, so apply rounded-sheet only to the top corners.
            side === 'bottom' && 'inset-x-0 bottom-0 h-auto rounded-t-sheet border-x-0 border-b-0',
            className
          )}
          {...props}
          asChild
        >
          {/* Enter/exit by one full component size (100%) toward the attached edge using lib/overlay-motion. */}
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
                <span className="sr-only">{closeLabel}</span>
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
