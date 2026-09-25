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
  /** 되돌릴 수 없는 작업 — 확인 버튼을 destructive 로 */
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
  // 스크림과 패널이 둘 다 사라진 뒤에 overlay-kit 에서 뺀다 — 먼저 끝난 쪽이 나머지를 끊지 않게.
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
          {/* dialog.tsx 와 같은 스크림 위 굴절 유리(dense) · 같은 움직임(lib/overlay-motion) */}
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
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
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

function alert({ title = 'Notice', description, confirmText = 'OK' }: AlertOptions): Promise<void> {
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
 * 바텀시트(아래→위) 오버레이 — popup.confirm 과 같은 overlay-kit 임페러티브 패턴. 면은 bottom-sheet 템플릿
 * (핸들을 끌어내려 닫는 시트)이다. 모바일에서 Popover 대신 시트로 띄울 때(예: 캘린더·시간 선택). render 콜백이
 * resolve(값)을 부르면 그 값으로 Promise 가 풀리고, 딤/핸들/드래그/ESC 로 닫으면 undefined 로 풀린다.
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
