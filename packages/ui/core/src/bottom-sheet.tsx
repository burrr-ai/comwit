'use client'

/**
 * comwit-ui — bottom-sheet 프리미티브 (헤드리스 · 스타일 0).
 *
 * 아래에서 올라오는 시트. Dialog 엔진(포털·스크림·포커스 트랩·ESC·바깥 클릭·스크롤 잠금) 위에
 * **끌어내려 닫는 제스처**를 얹는다. 핸들이나 시트 본문을 아래로 끌면 시트가 손가락을 따라오고,
 * 놓는 순간 거리(시트 높이 대비)나 속도가 문턱을 넘으면 닫히고, 아니면 제자리로 돌아온다.
 * 본문 안의 스크롤러는 맨 위에 있을 때만 시트를 끈다 — 그 외엔 평소처럼 스크롤된다.
 *
 *   <BottomSheet.Root open={open} onOpenChange={setOpen}>
 *     <BottomSheet.Trigger>Open</BottomSheet.Trigger>
 *     <BottomSheet.Portal>
 *       <BottomSheet.Overlay />
 *       <BottomSheet.Content>
 *         <BottomSheet.Handle />
 *         <BottomSheet.Title>…</BottomSheet.Title>
 *       </BottomSheet.Content>
 *     </BottomSheet.Portal>
 *   </BottomSheet.Root>
 *
 *  - Content   끌린 거리(px)를 `--sheet-drag` 로, 시트 높이 대비 비율(0~1)을 `--sheet-drag-progress` 로 자기 요소에 쓴다.
 *              끄는 동안 `data-dragging=""`. 시각(translate · 되돌아오는 전환 · 열림/닫힘 애니메이션)은 소비 CSS 가 그린다.
 *              드래그로 닫힐 땐 `--sheet-drag` 를 그대로 둔 채 닫힌다 — 닫힘 애니메이션이 끌린 자리에서 이어진다.
 *  - Overlay   같은 `--sheet-drag-progress` · `data-dragging` 을 받는다(끌수록 스크림이 옅어지게).
 *  - Handle    그래버. 탭하면 닫힌다. `touch-action: none` 을 인라인으로 강제한다.
 *  - Trigger · Portal · Title · Description · Close 는 Dialog 의 것과 같다.
 */

import * as React from 'react'

import * as DialogPrimitive from './dialog'
import { composeEventHandlers } from './internal/compose-event-handlers'
import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'
import { useControllableState } from './internal/use-controllable-state'

const ROOT_NAME = 'BottomSheet'
const DRAG_VAR = '--sheet-drag'
const PROGRESS_VAR = '--sheet-drag-progress'
/** 드래그로 인정할 최소 이동(px) — 탭·미세 움직임과 구분한다. */
const DRAG_SLOP = 6
/** 위로 끌 때 따라오는 최대 거리(px). 시트는 위로는 조금만 늘어난다. */
const OVERSHOOT = 28
/** 놓는 순간의 속도를 재는 최근 샘플 창(ms). */
const VELOCITY_WINDOW = 100
/** 드래그 직후 딸려오는 클릭(핸들 탭 · 자식 버튼)을 삼키는 시간(ms). */
const CLICK_SWALLOW_MS = 350

type BottomSheetContextValue = {
  onOpenChange: (open: boolean) => void
  overlayRef: React.RefObject<HTMLDivElement | null>
  handleRef: React.RefObject<HTMLDivElement | null>
}
const [BottomSheetProvider, useBottomSheetContext] =
  createContext<BottomSheetContextValue>(ROOT_NAME)

/* -------------------------------------------------------------------------------------------------
 * Root — Dialog.Root 를 제어 모드로 감싸고, 제스처가 닫기를 부를 수 있게 onOpenChange 를 컨텍스트에 둔다.
 * -----------------------------------------------------------------------------------------------*/

interface BottomSheetRootProps extends DialogPrimitive.DialogProps {}

const BottomSheetRoot: React.FC<BottomSheetRootProps> = (props) => {
  const { open: openProp, defaultOpen, onOpenChange, children, ...dialogProps } = props
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: ROOT_NAME,
  })
  const overlayRef = React.useRef<HTMLDivElement | null>(null)
  const handleRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <BottomSheetProvider onOpenChange={setOpen} overlayRef={overlayRef} handleRef={handleRef}>
      <DialogPrimitive.Root {...dialogProps} open={open} onOpenChange={setOpen}>
        {children}
      </DialogPrimitive.Root>
    </BottomSheetProvider>
  )
}
BottomSheetRoot.displayName = ROOT_NAME

/* -------------------------------------------------------------------------------------------------
 * Overlay — 스크림. 드래그 진행도를 받아 소비 CSS 가 옅어지게 그릴 수 있다.
 * -----------------------------------------------------------------------------------------------*/

const OVERLAY_NAME = 'BottomSheetOverlay'

const BottomSheetOverlay = React.forwardRef<HTMLDivElement, DialogPrimitive.DialogOverlayProps>(
  (props, forwardedRef) => {
    const context = useBottomSheetContext(OVERLAY_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.overlayRef)
    return <DialogPrimitive.Overlay {...props} ref={composedRef} />
  }
)
BottomSheetOverlay.displayName = OVERLAY_NAME

/* -------------------------------------------------------------------------------------------------
 * Content — Dialog.Content + 끌어내려 닫기.
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = 'BottomSheetContent'

interface BottomSheetContentProps extends DialogPrimitive.DialogContentProps {
  /** 시트 높이 대비 이 비율보다 많이 끌고 놓으면 닫힌다. 기본 0.25. */
  closeThreshold?: number
  /** 이 속도(px/ms)보다 빠르게 아래로 튕기면 거리와 무관하게 닫힌다. 기본 0.4. */
  velocityThreshold?: number
  /**
   * 어디서 끌 수 있는지. 'sheet' 는 시트 어디서든(본문 스크롤이 맨 위일 때), 'handle' 은 핸들에서만.
   * false 면 제스처를 끈다. 기본 'sheet'.
   */
  drag?: 'sheet' | 'handle' | false
}

const BottomSheetContent = React.forwardRef<HTMLDivElement, BottomSheetContentProps>(
  (props, forwardedRef) => {
    const {
      closeThreshold = 0.25,
      velocityThreshold = 0.4,
      drag = 'sheet',
      style,
      ...contentProps
    } = props
    const context = useBottomSheetContext(CONTENT_NAME)
    // 콘텐츠 DOM 은 열릴 때마다 새로 마운트된다(Presence) — 콜백 ref 로 받아 그때 제스처를 건다.
    const [content, setContent] = React.useState<HTMLDivElement | null>(null)
    const composedRef = useComposedRefs(forwardedRef, setContent)
    const closeRef = React.useRef(context.onOpenChange)
    React.useEffect(() => {
      closeRef.current = context.onOpenChange
    }, [context.onOpenChange])

    React.useEffect(() => {
      if (!content || !drag) return
      const { overlayRef, handleRef } = context

      let startX = 0
      let startY = 0
      let current = 0
      let engaged = false
      let tracking = false
      let mouseId: number | null = null
      let samples: { y: number; t: number }[] = []
      let swallowTimer = 0

      const overlay = () => overlayRef.current
      const apply = (px: number) => {
        const progress = Math.min(1, Math.max(0, px / (content.offsetHeight || 1)))
        content.style.setProperty(DRAG_VAR, `${px}px`)
        content.style.setProperty(PROGRESS_VAR, String(progress))
        overlay()?.style.setProperty(PROGRESS_VAR, String(progress))
      }
      const setDragging = (on: boolean) => {
        for (const element of [content, overlay()]) {
          if (!element) continue
          if (on) element.setAttribute('data-dragging', '')
          else element.removeAttribute('data-dragging')
        }
      }

      /** 이 타깃에서 제스처를 시작해도 되는가. */
      const allowed = (target: EventTarget | null) => {
        const element = target as HTMLElement | null
        if (!element) return false
        if (drag === 'handle') return Boolean(handleRef.current?.contains(element))
        // 텍스트 입력·선택 위에서는 시작하지 않는다 — 마우스 드래그가 텍스트 선택이어야 한다.
        return !element.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
        )
      }
      /** target → content 사이에 위로 스크롤 여지가 있는 스크롤러가 있으면 시트 대신 그쪽이 움직인다. */
      const yieldsToInnerScroll = (target: EventTarget | null) => {
        let element = target as HTMLElement | null
        while (element && element !== content) {
          if (element.scrollTop > 0) {
            const overflowY = getComputedStyle(element).overflowY
            if (overflowY === 'auto' || overflowY === 'scroll') return true
          }
          element = element.parentElement
        }
        return false
      }

      // 드래그 직후 딸려오는 클릭 하나를 삼킨다(핸들 탭 닫기 · 자식 버튼 오작동 방지).
      const swallowNextClick = () => {
        const done = () => {
          window.clearTimeout(swallowTimer)
          content.removeEventListener('click', swallow, true)
        }
        const swallow = (event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          done()
        }
        content.addEventListener('click', swallow, true)
        swallowTimer = window.setTimeout(done, CLICK_SWALLOW_MS)
      }

      const begin = (x: number, y: number, target: EventTarget | null) => {
        if (!allowed(target)) return false
        startX = x
        startY = y
        current = 0
        engaged = false
        samples = [{ y, t: performance.now() }]
        return true
      }

      /** true 를 돌려주면 호출부가 기본 동작(네이티브 스크롤·바운스)을 막는다. 'cancel' 은 이 제스처를 포기한다. */
      const move = (x: number, y: number, target: EventTarget | null): boolean | 'cancel' => {
        const now = performance.now()
        samples.push({ y, t: now })
        if (samples.length > 2) samples = samples.filter((s) => now - s.t <= VELOCITY_WINDOW)
        if (!engaged) {
          const dy = y - startY
          const dx = x - startX
          if (Math.abs(dx) > DRAG_SLOP && Math.abs(dx) > Math.abs(dy)) return 'cancel' // 가로 제스처
          if (dy <= DRAG_SLOP) return false
          if (yieldsToInnerScroll(target)) {
            startY = y // 아직 안쪽이 스크롤 중 — 기준점을 끌어와 맨 위 도달 즉시 0부터 끌린다
            return false
          }
          engaged = true
          startY = y // 발동 순간 튐 방지
          setDragging(true)
          apply(0)
          return true
        }
        const dy = y - startY
        current = dy >= 0 ? dy : -OVERSHOOT * (1 - Math.exp(dy / OVERSHOOT))
        apply(current)
        return true
      }

      const end = () => {
        if (!engaged) return
        engaged = false
        const first = samples[0]
        const last = samples[samples.length - 1]
        const velocity = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0
        const height = content.offsetHeight || 1
        const flungDown = velocity > velocityThreshold
        const flungUp = velocity < -velocityThreshold
        const farEnough = current / height > closeThreshold
        swallowNextClick()
        setDragging(false)
        if (current > 0 && (flungDown || (farEnough && !flungUp))) {
          // 끌린 자리는 그대로 둔다 — 닫힘 애니메이션이 거기서 이어받는다.
          closeRef.current(false)
        } else {
          apply(0)
        }
        samples = []
      }

      // ── 터치 — touchmove 는 non-passive 여야 네이티브 스크롤·바운스를 막을 수 있다 ──
      const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return
        tracking = begin(event.touches[0].clientX, event.touches[0].clientY, event.target)
      }
      const onTouchMove = (event: TouchEvent) => {
        if (!tracking || event.touches.length !== 1) return
        const result = move(event.touches[0].clientX, event.touches[0].clientY, event.target)
        if (result === 'cancel') tracking = false
        else if (result && event.cancelable) event.preventDefault()
      }
      const onTouchEnd = () => {
        tracking = false
        end()
      }

      // ── 마우스 — 데스크톱에서도 같은 제스처로 닫을 수 있게 ──
      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        if (begin(event.clientX, event.clientY, event.target)) mouseId = event.pointerId
      }
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerId !== mouseId) return
        const wasEngaged = engaged
        const result = move(event.clientX, event.clientY, event.target)
        if (result === 'cancel') mouseId = null
        else if (result) {
          if (!wasEngaged) content.setPointerCapture(event.pointerId)
          event.preventDefault()
        }
      }
      const onPointerUp = (event: PointerEvent) => {
        if (event.pointerId !== mouseId) return
        mouseId = null
        if (content.hasPointerCapture(event.pointerId))
          content.releasePointerCapture(event.pointerId)
        end()
      }

      content.addEventListener('touchstart', onTouchStart, { passive: true })
      content.addEventListener('touchmove', onTouchMove, { passive: false })
      content.addEventListener('touchend', onTouchEnd, { passive: true })
      content.addEventListener('touchcancel', onTouchEnd, { passive: true })
      content.addEventListener('pointerdown', onPointerDown)
      content.addEventListener('pointermove', onPointerMove)
      content.addEventListener('pointerup', onPointerUp)
      content.addEventListener('pointercancel', onPointerUp)
      return () => {
        content.removeEventListener('touchstart', onTouchStart)
        content.removeEventListener('touchmove', onTouchMove)
        content.removeEventListener('touchend', onTouchEnd)
        content.removeEventListener('touchcancel', onTouchEnd)
        content.removeEventListener('pointerdown', onPointerDown)
        content.removeEventListener('pointermove', onPointerMove)
        content.removeEventListener('pointerup', onPointerUp)
        content.removeEventListener('pointercancel', onPointerUp)
        window.clearTimeout(swallowTimer)
        setDragging(false)
      }
    }, [content, drag, closeThreshold, velocityThreshold, context])

    return (
      <DialogPrimitive.Content
        {...contentProps}
        ref={composedRef}
        // 첫 프레임부터 변수가 있어야 `translate-y-(--sheet-drag)` 같은 소비 유틸이 유효하다.
        style={{ [DRAG_VAR]: '0px', [PROGRESS_VAR]: '0', ...style } as React.CSSProperties}
      />
    )
  }
)
BottomSheetContent.displayName = CONTENT_NAME

/* -------------------------------------------------------------------------------------------------
 * Handle — 그래버. 장식이라 스크린리더에는 숨기고(닫기는 Close · ESC), 탭하면 닫힌다.
 * -----------------------------------------------------------------------------------------------*/

const HANDLE_NAME = 'BottomSheetHandle'

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>
interface BottomSheetHandleProps extends PrimitiveDivProps {}

const BottomSheetHandle = React.forwardRef<HTMLDivElement, BottomSheetHandleProps>(
  (props, forwardedRef) => {
    const { style, ...handleProps } = props
    const context = useBottomSheetContext(HANDLE_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.handleRef)
    return (
      <Primitive.div
        aria-hidden="true"
        {...handleProps}
        ref={composedRef}
        // 핸들 위에서는 브라우저가 스크롤을 가로채지 못하게 한다 — 첫 움직임부터 시트가 따라온다.
        style={{ touchAction: 'none', ...style }}
        onClick={composeEventHandlers(props.onClick, () => context.onOpenChange(false))}
      />
    )
  }
)
BottomSheetHandle.displayName = HANDLE_NAME

/* ---------------------------------------------------------------------------------------------- */

const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetPortal = DialogPrimitive.Portal
const BottomSheetTitle = DialogPrimitive.Title
const BottomSheetDescription = DialogPrimitive.Description
const BottomSheetClose = DialogPrimitive.Close

const Root = BottomSheetRoot
const Trigger = BottomSheetTrigger
const Portal = BottomSheetPortal
const Overlay = BottomSheetOverlay
const Content = BottomSheetContent
const Handle = BottomSheetHandle
const Title = BottomSheetTitle
const Description = BottomSheetDescription
const Close = BottomSheetClose

export {
  BottomSheetRoot,
  BottomSheetTrigger,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetContent,
  BottomSheetHandle,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetClose,
  //
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Handle,
  Title,
  Description,
  Close,
}
export type { BottomSheetRootProps, BottomSheetContentProps, BottomSheetHandleProps }
