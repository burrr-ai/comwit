'use client'

import type { ReactNode } from 'react'
import { overlay } from 'overlay-kit'
import { AnimatePresence, motion } from 'motion/react'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet'

interface ConfirmOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
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
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPortal forceMount>
        <AnimatePresence onExitComplete={onUnmount}>
          {isOpen && (
            <DialogPrimitive.Overlay key="popup-overlay" forceMount asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-overlay bg-overlay"
              />
            </DialogPrimitive.Overlay>
          )}
          {isOpen && (
            <DialogPrimitive.Content
              key="popup-content"
              forceMount
              className="pointer-events-none fixed inset-0 z-modal grid place-items-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="bg-popover text-popover-foreground pointer-events-auto grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl border border-border p-6 shadow-lg sm:max-w-lg"
              >
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          )}
        </AnimatePresence>
      </DialogPortal>
    </Dialog>
  )
}

function confirm({
  title = '확인',
  description,
  confirmText = '확인',
  cancelText = '취소',
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

function alert({ title = '알림', description, confirmText = '확인' }: AlertOptions): Promise<void> {
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

/** 바텀시트 렌더 콜백에 넘기는 제어 API. resolve(value)=값 확정 후 닫기, close()=취소 닫기. */
export type SheetApi<T> = {
  resolve: (value: T) => void
  close: () => void
}

interface SheetOptions {
  title: string
  description?: string
  /** 시트 콘텐츠 최대 폭(태블릿 이상 가운데 정렬). 기본 520. */
  maxWidth?: number
}

/**
 * 바텀시트(아래→위) 오버레이 — popup.confirm 과 같은 overlay-kit 임페러티브 패턴.
 * 모바일에서 Popover 대신 시트로 띄울 때(예: 캘린더·시간 선택). render 콜백이 resolve(값)을
 * 부르면 그 값으로 Promise 가 풀리고, 딤/✕/스와이프로 닫으면 undefined 로 풀린다.
 *
 * @example
 * const ymd = await popup.sheet<string>(({ resolve }) => <CalendarPanel onSelect={resolve} />, { title: '날짜 선택' })
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
        <Sheet
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) settle(undefined)
          }}
        >
          <SheetContent
            side="bottom"
            style={{ maxWidth }}
            className="mx-auto gap-0 rounded-t-3xl border-0 bg-popover px-5 pb-8 pt-5"
          >
            <SheetHeader className="p-0">
              <SheetTitle className="text-title-md text-foreground">{title}</SheetTitle>
              {description ? (
                <SheetDescription className="text-caption text-soft-foreground">
                  {description}
                </SheetDescription>
              ) : null}
            </SheetHeader>
            <div className="mt-4">
              {render({ resolve: (v) => settle(v), close: () => settle(undefined) })}
            </div>
          </SheetContent>
        </Sheet>
      )
    })
  })
}

export const popup = { alert, confirm, sheet }
