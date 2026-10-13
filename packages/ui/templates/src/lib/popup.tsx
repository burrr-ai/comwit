'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import { overlay } from 'overlay-kit'
import { Dialog as DialogPrimitive } from '@comwit/ui'
import {
  Dialog,
  DialogPortal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { GlassSurface } from '../components/ui/glass'
import { OverlayMotion } from './overlay-motion'
import { uiText } from './ui-text'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from '../components/ui/bottom-sheet'

interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  /** Irreversible action: use the destructive confirm-button style. */
  destructive?: boolean
}

interface AlertOptions {
  title?: string
  description: string
  confirmText?: string
}

function PopupShell({
  isOpen,
  onClose,
  onUnmount,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  onUnmount: () => void
  children: React.ReactNode
}) {
  // Remove from overlay-kit only after both scrim and panel disappear, so the first to finish does not interrupt the other.
  const exiting = React.useRef(2)
  const settle = () => {
    exiting.current -= 1
    if (exiting.current === 0) onUnmount()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPortal>
        <DialogPrimitive.Overlay asChild>
          <OverlayMotion
            preset="scrim"
            onExitComplete={settle}
            className="fixed inset-0 z-overlay bg-overlay"
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content className="pointer-events-none fixed inset-0 z-modal grid place-items-center">
          {/* Same dense glass above the scrim and same lib/overlay-motion animation as dialog.tsx. */}
          <GlassSurface variant="morphing" shape="panel" dense>
            <OverlayMotion
              preset="dialog"
              onExitComplete={settle}
              className="text-popover-foreground pointer-events-auto grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-card p-6 sm:max-w-lg"
            >
              {children}
            </OverlayMotion>
          </GlassSurface>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

function confirm({
  title = uiText.popup.confirmTitle,
  description,
  confirmText = uiText.popup.confirm,
  cancelText = uiText.popup.cancel,
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <PopupShell
        isOpen={isOpen}
        onClose={() => {
          resolve(false)
          close()
        }}
        onUnmount={unmount}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resolve(false)
              close()
            }}
          >
            {cancelText}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => {
              resolve(true)
              close()
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </PopupShell>
    ))
  })
}

function alert({
  title = uiText.popup.alertTitle,
  description,
  confirmText = uiText.popup.ok,
}: AlertOptions): Promise<void> {
  return new Promise((resolve) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <PopupShell
        isOpen={isOpen}
        onClose={() => {
          resolve()
          close()
        }}
        onUnmount={unmount}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              resolve()
              close()
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </PopupShell>
    ))
  })
}

/** Control API passed to the bottom-sheet renderer: resolve(value) confirms and closes; close() cancels. */
export type SheetApi<T> = {
  resolve: (value: T) => void
  close: () => void
}

interface SheetOptions {
  title: string
  description?: string
  /** Maximum sheet-content width, centered on tablet and larger screens. Defaults to 520. */
  maxWidth?: number
}

/**
 * Bottom-to-top sheet overlay using the same imperative overlay-kit pattern as popup.confirm. Uses the
 * bottom-sheet template with a drag-to-dismiss handle. Useful instead of mobile popovers, such as date/time
 * pickers. Calling resolve(value) from the renderer resolves the Promise with that value. Dismissal through
 * the scrim, handle, dragging, or Escape resolves it with undefined.
 *
 * @example
 * const ymd = await popup.sheet<string>(({ resolve }) => <CalendarPanel onSelect={resolve} />, { title: 'Select date' })
 */
function sheet<T = void>(
  render: (api: SheetApi<T>) => ReactNode,
  { title, description, maxWidth = 520 }: SheetOptions
): Promise<T | undefined> {
  return new Promise((resolve) => {
    let settled = false
    overlay.open(({ isOpen, close }) => {
      const settle = (value: T | undefined) => {
        if (!settled) {
          settled = true
          resolve(value)
        }
        close()
      }
      return (
        <BottomSheet
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) settle(undefined)
          }}
        >
          <BottomSheetContent style={{ maxWidth }}>
            <BottomSheetHeader>
              <BottomSheetTitle>{title}</BottomSheetTitle>
              {description ? <BottomSheetDescription>{description}</BottomSheetDescription> : null}
            </BottomSheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-6">
              {render({ resolve: (v) => settle(v), close: () => settle(undefined) })}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )
    })
  })
}

export const popup = { alert, confirm, sheet }
