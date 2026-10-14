'use client'

/**
 * BottomSheet — sheet rising from the bottom. Drag the top handle downward or tap it to close.
 *
 * The @comwit/ui BottomSheet primitive owns dragging, distance/velocity thresholds, nested-scroll handoff,
 * focus trapping, Escape, and scrim behavior. This layer adds the glass surface, handle, and spacing.
 * Translate follows the primitive's --sheet-drag; transitions are disabled during data-dragging and return the
 * sheet to rest on release. The scrim fades with --sheet-drag-progress. lib/overlay-motion animates entry/exit
 * using transform: from the first opening it travels its full height (100%), then exits all the way down before
 * unmounting. A drag dismissal continues from the dragged position.
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
 * For long content, use min-h-0 flex-1 overflow-y-auto on the middle section; the sheet follows only when
 * that scroller is at the top. Set container to portal inside an app shell, such as a transformed phone frame.
 */

import * as React from 'react'
import { BottomSheet as BottomSheetPrimitive } from '@comwit/ui'
import { XIcon } from '@comwit/ui/icons'

import { GlassSurface } from './glass'
import { OverlayMotion } from '../../lib/overlay-motion'
import { cn } from '../../lib/utils'
import { uiText } from '../../lib/ui-text'
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
      {/* The outer layer (lib/overlay-motion) owns enter/exit opacity; the inner surface owns drag fading so they do not compete for one property. */}
      <OverlayMotion preset="scrim">
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 bg-overlay',
            // Fade while dragging using progress inherited from the outer primitive element. Update immediately without transitions during dragging.
            'opacity-[calc(1-var(--sheet-drag-progress,0))] transition-opacity duration-slow group-data-[dragging]/scrim:transition-none'
          )}
        />
      </OverlayMotion>
    </BottomSheetPrimitive.Overlay>
  )
}

/** Grabber: the primitive owns tap-to-close and touch-action; this layer only draws the bar. */
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
  /** Portal target, defaulting to body. Pass an app-shell element to render inside it. */
  container?: React.ComponentProps<typeof BottomSheetPrimitive.Portal>['container']
  /** Top grabber. Defaults to true. */
  showHandle?: boolean
  /** Top-right close X. Defaults to false because the handle is present. */
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
      {/* Dense refractive glass above the scrim: .glass owns surface, border, and shadow. Remove the border along the edge attached to the bottom. */}
      <GlassSurface variant="morphing" shape="panel" dense>
        <BottomSheetPrimitive.Content
          data-slot="bottom-sheet-content"
          className={cn(
            'fixed inset-x-0 bottom-0 z-modal mx-auto flex max-h-[calc(100%-2.5rem)] w-full max-w-lg flex-col rounded-t-sheet border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] text-popover-foreground outline-none',
            // Translate follows the finger without a transition while dragging, then returns to rest on release. Entry/exit uses transform
            // separately in lib/overlay-motion, so only translate transitions here. Drag dismissal continues downward from the dragged position.
            'translate-y-(--sheet-drag) transition-[translate] duration-slower ease-[cubic-bezier(0.22,1,0.36,1)] data-[dragging]:transition-none',
            className
          )}
          {...props}
          asChild
        >
          {/* Travel one full component height (100%) up from or down to the bottom edge. */}
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
                <span className="sr-only">{uiText.close}</span>
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
