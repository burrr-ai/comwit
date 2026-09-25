'use client'

/**
 * comwit-ui — drag-scroller 프리미티브 (헤드리스 · 스타일 0).
 *
 * translateX 기반 **수동 가로 스크롤러** — 마우스 드래그·플릭 관성 · 트랙패드/휠 · 터치 · 키보드(←/→) ·
 * 포커스 진입 시 보이게 이동. 네이티브 overflow 대신 transform 을 쓰는 이유:
 *  - 위치가 트랙의 인라인 transform 에 살아 숨겨져도(display:none) 잃지 않고, 리렌더가 덮어쓰지 않는다.
 *  - getBoundingClientRect 가 transform 을 반영해 공유 요소 페이지 전환이 스크롤된 타일의 실제 위치를 잰다.
 *
 *   <DragScroller.Root apiRef={api} onOffsetCommit={save} initialOffset={saved}>
 *     <DragScroller.Track>{tiles}</DragScroller.Track>
 *   </DragScroller.Root>
 *
 * Root 는 구조에 필요한 인라인 스타일(overflow:hidden · touch-action:pan-y · user-select:none)만 강제하고,
 * 드래그 중엔 `data-state="dragging"` 을 단다. 커서·간격·정렬은 소비 레이어의 className 이 정한다.
 * `apiRef` 로 `scrollByAmount(px)` 를 받아 화살표 버튼을 붙일 수 있다.
 */

import * as React from 'react'

import { composeEventHandlers } from './internal/compose-event-handlers'
import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'
import { useLayoutEffect } from './internal/use-layout-effect'

const FRICTION = 0.95 // 16ms 프레임당 감속(플릭 관성)
const MIN_VELOCITY = 0.02 // px/ms — 이 아래면 관성 종료
const DRAG_THRESHOLD = 8 // px — 이 이상 움직여야 "드래그"(클릭 삼킴 + 캡처). 그 아래는 탭
const LINE_HEIGHT = 16 // px, wheel deltaMode=line 정규화
const KEY_STEP_RATIO = 0.8 // 방향키 한 번에 뷰포트 너비의 이 비율만큼
const CLICK_SWALLOW_MS = 350 // 드래그 직후 이 시간 안의 클릭은 삼킨다
const STEP_DURATION = 350 // ms — 버튼/명령형 스크롤 트윈 길이

const ROOT_NAME = 'DragScroller'

type DragScrollerApi = {
  /** 트랙을 `px` 만큼 부드럽게 민다(양수 = 끝 쪽으로). */
  scrollByAmount: (px: number) => void
  /** 절대 위치로 부드럽게 이동한다. */
  scrollToOffset: (px: number) => void
  /** 현재 위치(px). */
  getOffset: () => number
}

type DragScrollerContextValue = {
  trackRef: React.RefObject<HTMLDivElement | null>
  restoredOffset: number
}
const [DragScrollerProvider, useDragScrollerContext] =
  createContext<DragScrollerContextValue>(ROOT_NAME)

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>

interface DragScrollerRootProps extends PrimitiveDivProps {
  /** 다시 마운트될 때의 시작 위치. 이후 값이 바뀌어도 움직이지 않는다. */
  initialOffset?: number
  /** 숨겨지거나 언마운트될 때 현재 위치를 넘긴다(프레임마다 부르지 않는다). */
  onOffsetCommit?: (offset: number) => void
  /** 명령형 API(화살표 버튼 등). */
  apiRef?: React.Ref<DragScrollerApi>
}

const DragScrollerRoot = React.forwardRef<HTMLDivElement, DragScrollerRootProps>(
  (props, forwardedRef) => {
    const { initialOffset = 0, onOffsetCommit, apiRef, style, children, ...rootProps } = props
    const viewportRef = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const composedRef = useComposedRefs(forwardedRef, viewportRef)

    const [restoredOffset] = React.useState(() =>
      Number.isFinite(initialOffset) ? Math.max(0, initialOffset) : 0
    )
    const offset = React.useRef(restoredOffset) // 현재 스크롤 양(px); transform = translateX(-offset)
    const commitOffset = React.useRef(onOffsetCommit)
    const vel = React.useRef(0) // px/ms (포인터 관성)
    const max = React.useRef(0)
    const raf = React.useRef(0)
    const dragging = React.useRef(false) // 임계값을 넘어 실제 드래그 중(= 캡처됨)
    const start = React.useRef({ x: 0, off: 0, t: 0, pointerId: -1, pending: false })

    const apply = () => {
      const track = trackRef.current
      if (track) track.style.transform = `translate3d(${-offset.current}px,0,0)`
    }
    const clamp = (v: number) => (v < 0 ? 0 : v > max.current ? max.current : v)
    const computeMax = () => {
      const viewport = viewportRef.current
      const track = trackRef.current
      if (!viewport || !track || !viewport.clientWidth) return // display:none → max 유지(위치 보존)
      max.current = Math.max(0, track.scrollWidth - viewport.clientWidth)
    }
    const setOffset = (v: number) => {
      offset.current = clamp(v)
      apply()
    }
    const stopMomentum = () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      raf.current = 0
    }
    const setDragState = (on: boolean) => {
      const viewport = viewportRef.current
      if (!viewport) return
      if (on) viewport.setAttribute('data-state', 'dragging')
      else viewport.removeAttribute('data-state')
    }

    useLayoutEffect(() => {
      commitOffset.current = onOffsetCommit
    }, [onOffsetCommit])

    useLayoutEffect(() => {
      // 전환이 위치를 재거나 브라우저가 그리기 전에 복원한다.
      computeMax()
      if (viewportRef.current?.clientWidth) setOffset(offset.current)
      return () => {
        stopMomentum()
        commitOffset.current?.(offset.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const momentum = () => {
      let last = performance.now()
      const step = (now: number) => {
        const dt = now - last
        last = now
        if (Math.abs(vel.current) < MIN_VELOCITY) return void (raf.current = 0)
        const next = clamp(offset.current + vel.current * dt)
        if (next === offset.current) return void ((vel.current = 0), (raf.current = 0)) // 끝에 닿음
        offset.current = next
        apply()
        vel.current *= Math.pow(FRICTION, dt / 16) // 프레임레이트 무관 감속
        raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    }

    // 절대 목표까지 부드러운 트윈(화살표 버튼 / 명령형).
    const animateTo = (target: number) => {
      stopMomentum()
      computeMax()
      vel.current = 0
      const from = offset.current
      const to = clamp(target)
      if (from === to) return
      const startT = performance.now()
      const ease = (p: number) => 1 - Math.pow(1 - p, 3) // easeOutCubic
      const step = (now: number) => {
        const p = Math.min(1, (now - startT) / STEP_DURATION)
        offset.current = from + (to - from) * ease(p)
        apply()
        raf.current = p < 1 ? requestAnimationFrame(step) : 0
      }
      raf.current = requestAnimationFrame(step)
    }

    React.useImperativeHandle(
      apiRef,
      () => ({
        scrollByAmount: (px: number) => animateTo(offset.current + px),
        scrollToOffset: (px: number) => animateTo(px),
        getOffset: () => offset.current,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    )

    // 드래그/관성 정지 직후 딸려오는 클릭(자식 <Link> 내비) 하나를 삼킨다. 350ms 뒤 자동 해제.
    const swallowNextClick = () => {
      const viewport = viewportRef.current
      if (!viewport) return
      let timer = 0
      const done = () => {
        window.clearTimeout(timer)
        viewport.removeEventListener('click', swallow, true)
      }
      const swallow = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        done()
      }
      viewport.addEventListener('click', swallow, true)
      timer = window.setTimeout(done, CLICK_SWALLOW_MS)
    }

    // ── 포인터 드래그 ──
    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return // 주 버튼 / 터치 / 펜만
      if (dragging.current || start.current.pending) return // 다른 포인터가 소유 중 → 멀티터치 격리
      const wasMoving = raf.current !== 0
      stopMomentum()
      computeMax()
      vel.current = 0
      dragging.current = false
      start.current = {
        x: event.clientX,
        off: offset.current,
        t: performance.now(),
        pointerId: event.pointerId,
        pending: true,
      }
      if (wasMoving) swallowNextClick() // 관성 중 탭 = 멈추려는 의도, 내비가 아니다
    }
    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = start.current
      if (event.pointerId !== s.pointerId) return
      if (!s.pending && !dragging.current) return
      if (!dragging.current) {
        if (Math.abs(event.clientX - s.x) < DRAG_THRESHOLD) return
        // 임계값을 넘겨야 캡처한다 — 그래야 탭이 클릭으로 살아남는다
        dragging.current = true
        s.pending = false
        s.x = event.clientX // 튐 방지를 위해 현재 지점으로 재기준
        s.off = offset.current
        s.t = performance.now()
        viewportRef.current?.setPointerCapture(event.pointerId)
        setDragState(true)
        return
      }
      const now = performance.now()
      const next = clamp(s.off - (event.clientX - s.x))
      const dt = now - s.t
      if (dt > 0) vel.current = (next - offset.current) / dt
      offset.current = next
      apply()
      s.t = now
    }
    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = start.current
      if (event.pointerId !== s.pointerId) return
      if (dragging.current) {
        dragging.current = false
        viewportRef.current?.releasePointerCapture?.(event.pointerId)
        setDragState(false)
        swallowNextClick() // 내비게이션이 될 클릭을 삼킨다
        if (Math.abs(vel.current) >= MIN_VELOCITY) momentum()
      }
      s.pending = false
      s.pointerId = -1
    }
    const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
      const s = start.current
      if (event.pointerId !== s.pointerId) return
      // cancel 은 클릭을 만들지 않는다 — 삼킬 것 없이 가드만 푼다.
      dragging.current = false
      viewportRef.current?.releasePointerCapture?.(event.pointerId)
      setDragState(false)
      s.pending = false
      s.pointerId = -1
    }

    // ── 키보드(←/→) ──
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
        return
      const viewport = viewportRef.current
      if (!viewport) return
      event.preventDefault()
      stopMomentum()
      computeMax()
      setOffset(
        offset.current +
          (event.key === 'ArrowRight' ? 1 : -1) * viewport.clientWidth * KEY_STEP_RATIO
      )
    }

    // ── 포커스 진입 시 보이게(Tab 으로 화면 밖 링크에 들어갈 때) ──
    const onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
      const viewport = viewportRef.current
      const track = trackRef.current
      const child = event.target as HTMLElement
      if (!viewport || !track || !track.contains(child)) return
      computeMax()
      const c = child.getBoundingClientRect()
      const v = viewport.getBoundingClientRect()
      let delta = 0
      if (c.left < v.left) delta = c.left - v.left
      else if (c.right > v.right) delta = c.right - v.right
      if (delta !== 0) setOffset(offset.current + delta)
    }

    // ── 휠/트랙패드 + 리사이즈: 네이티브(non-passive) 리스너 ──
    React.useEffect(() => {
      const viewport = viewportRef.current
      if (!viewport) return

      const onWheel = (event: WheelEvent) => {
        const unit =
          event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? viewport.clientWidth : 1
        let dx = event.deltaX * unit
        let dy = event.deltaY * unit
        if (event.shiftKey && dx === 0) {
          dx = dy // shift+휠 → 가로(브라우저가 바꿔주지 않을 때)
          dy = 0
        }
        if (Math.abs(dx) <= Math.abs(dy)) return // 세로 의도 → 페이지가 스크롤하게 둔다
        event.preventDefault() // 가로 의도만 소비
        stopMomentum()
        computeMax()
        setOffset(offset.current + dx)
      }
      viewport.addEventListener('wheel', onWheel, { passive: false })

      const observer = new ResizeObserver(() => {
        if (!viewport.clientWidth) return // display:none → 위치 유지
        computeMax()
        setOffset(offset.current) // 새 max 로 재클램프
      })
      observer.observe(viewport)
      if (trackRef.current) observer.observe(trackRef.current)

      return () => {
        viewport.removeEventListener('wheel', onWheel)
        observer.disconnect()
        stopMomentum()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <DragScrollerProvider trackRef={trackRef} restoredOffset={restoredOffset}>
        <Primitive.div
          {...rootProps}
          ref={composedRef}
          style={{ overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none', ...style }}
          onPointerDown={composeEventHandlers(props.onPointerDown, onPointerDown)}
          onPointerMove={composeEventHandlers(props.onPointerMove, onPointerMove)}
          onPointerUp={composeEventHandlers(props.onPointerUp, onPointerUp)}
          onPointerCancel={composeEventHandlers(props.onPointerCancel, onPointerCancel)}
          onKeyDown={composeEventHandlers(props.onKeyDown, onKeyDown)}
          onFocus={composeEventHandlers(props.onFocus, onFocus)}
          onDragStart={composeEventHandlers(props.onDragStart, (event) => event.preventDefault())}
        >
          {children}
        </Primitive.div>
      </DragScrollerProvider>
    )
  }
)
DragScrollerRoot.displayName = ROOT_NAME

const TRACK_NAME = 'DragScrollerTrack'

/** 실제로 움직이는 줄. 위치는 인라인 transform 이 갖는다. */
const DragScrollerTrack = React.forwardRef<HTMLDivElement, PrimitiveDivProps>(
  (props, forwardedRef) => {
    const { style, ...trackProps } = props
    const context = useDragScrollerContext(TRACK_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.trackRef)
    return (
      <Primitive.div
        {...trackProps}
        ref={composedRef}
        style={{ transform: `translate3d(${-context.restoredOffset}px,0,0)`, ...style }}
      />
    )
  }
)
DragScrollerTrack.displayName = TRACK_NAME

/* ---------------------------------------------------------------------------------------------- */

const Root = DragScrollerRoot
const Track = DragScrollerTrack

export { DragScrollerRoot, DragScrollerTrack, Root, Track }
export type { DragScrollerRootProps, DragScrollerApi }
