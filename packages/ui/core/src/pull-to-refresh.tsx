'use client'

/**
 * comwit-ui — pull-to-refresh 프리미티브 (헤드리스 · 스타일 0).
 *
 * 스크롤 최상단에서 아래로 당겨 새로고침. 제스처·상태 머신·고무줄 저항을 전부 소유한다.
 *
 *   <PullToRefresh.Root onRefresh={reload}>
 *     <PullToRefresh.Indicator>{({ state }) => …}</PullToRefresh.Indicator>
 *     <PullToRefresh.Scroller ref={scrollRef}>{content}</PullToRefresh.Scroller>
 *   </PullToRefresh.Root>
 *
 *  - Root      래퍼. 당김 거리(px)를 `--ptr-pull` CSS 변수로 자기 요소에 쓴다 — 당기는 동안 리렌더 0.
 *  - Scroller  overflow-y:auto 스크롤러(구조 스타일은 인라인으로 강제). ScrollChromeProvider 에 넘길 ref 가 이것.
 *              **콘텐츠는 절대 transform 하지 않는다** — 안에 sticky 앱바·바텀내비가 살기 때문.
 *  - Indicator 상태를 `data-state="idle | pulling | armed | refreshing"` · `data-transition` 으로 방출한다.
 *              위치·불투명도·회전은 소비 CSS 가 `var(--ptr-pull)` 로 그린다.
 *
 * 터치는 네이티브 바운스를 억제하고, 마우스도 드래그로 당길 수 있다(데스크톱 미리보기용).
 */

import * as React from 'react'

import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'

const ROOT_NAME = 'PullToRefresh'
const PULL_VAR = '--ptr-pull'
/** 세로 당김으로 인정할 최소 이동(px) — 미세 터치/수평 스와이프 방지. */
const ENGAGE_SLOP = 8
/** 놓은 뒤 제자리로 돌아가는 전환 길이(ms). 소비 CSS 의 transition 과 맞춘다. */
const SETTLE_MS = 360

type PullState = 'idle' | 'pulling' | 'armed' | 'refreshing'
type PullSnapshot = { state: PullState; transition: boolean }

type PullStore = {
  get: () => PullSnapshot
  subscribe: (listener: () => void) => () => void
  set: (patch: Partial<PullSnapshot>) => void
}

function usePullStore(): PullStore {
  const snapshot = React.useRef<PullSnapshot>({ state: 'idle', transition: false })
  const listeners = React.useRef(new Set<() => void>())
  return React.useMemo(
    () => ({
      get: () => snapshot.current,
      subscribe: (listener) => {
        listeners.current.add(listener)
        return () => listeners.current.delete(listener)
      },
      set: (patch) => {
        const next = { ...snapshot.current, ...patch }
        if (
          next.state === snapshot.current.state &&
          next.transition === snapshot.current.transition
        )
          return
        snapshot.current = next
        listeners.current.forEach((listener) => listener())
      },
    }),
    []
  )
}

type PullToRefreshContextValue = {
  store: PullStore
  setScroller: (element: HTMLDivElement | null) => void
}
const [PullToRefreshProvider, usePullToRefreshContext] =
  createContext<PullToRefreshContextValue>(ROOT_NAME)

type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>

interface PullToRefreshRootProps extends PrimitiveDivProps {
  /** 새로고침 작업. 반환한 Promise 가 끝날 때까지 `refreshing` 이다. */
  onRefresh: () => Promise<unknown> | void
  /** false 면 제스처를 끈다(예: 데스크톱에서는 문서 스크롤). */
  enabled?: boolean
  /** 이 당김 거리(px)를 넘겨서 놓으면 발동한다. 기본 64. */
  threshold?: number
  /** 고무줄 상한(px). 기본 130. */
  maxPull?: number
  /** 새로고침이 도는 동안 안착할 당김 거리(px). 기본 60. */
  resting?: number
}

const PullToRefreshRoot = React.forwardRef<HTMLDivElement, PullToRefreshRootProps>(
  (props, forwardedRef) => {
    const {
      onRefresh,
      enabled = true,
      threshold = 64,
      maxPull = 130,
      resting = 60,
      ...rootProps
    } = props
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const composedRef = useComposedRefs(forwardedRef, wrapperRef)
    const [scroller, setScroller] = React.useState<HTMLDivElement | null>(null)
    const store = usePullStore()
    const refreshRef = React.useRef(onRefresh)
    React.useEffect(() => {
      refreshRef.current = onRefresh
    }, [onRefresh])

    React.useEffect(() => {
      const wrapper = wrapperRef.current
      if (!scroller || !wrapper || !enabled) return

      let startY = 0
      let startX = 0
      let pulling = false
      let refreshing = false
      let current = 0
      let mouseId: number | null = null
      let settleTimer = 0

      const apply = (px: number) => wrapper.style.setProperty(PULL_VAR, `${px}`)
      const reset = () => wrapper.style.removeProperty(PULL_VAR)
      /** 고무줄 저항 — 당길수록 덜 내려오며 maxPull 로 점근한다. */
      const resist = (dy: number) => maxPull * (1 - Math.exp(-dy / maxPull))

      /** target → scroller 사이에 위로 스크롤 여지가 있는 조상이 있으면 그쪽에 양보한다. */
      const yieldsToInnerScroll = (target: EventTarget | null) => {
        let element = target as HTMLElement | null
        while (element && element !== scroller) {
          if (element.scrollTop > 0) {
            const overflowY = getComputedStyle(element).overflowY
            if (overflowY === 'auto' || overflowY === 'scroll') return true
          }
          element = element.parentElement
        }
        return false
      }

      const begin = (x: number, y: number) => {
        startY = y
        startX = x
        pulling = false
        current = 0
        window.clearTimeout(settleTimer)
        store.set({ transition: false })
      }

      /** true 를 돌려주면 호출부가 기본 동작(네이티브 스크롤·바운스)을 막는다. */
      const move = (x: number, y: number, target: EventTarget | null) => {
        if (!pulling) {
          const dy = y - startY
          const dx = x - startX
          const verticalDown = dy > ENGAGE_SLOP && dy > Math.abs(dx)
          if (verticalDown && scroller.scrollTop <= 0 && !yieldsToInnerScroll(target)) {
            pulling = true
            startY = y // 재기준점 → 발동 순간 튐 방지
            current = 0
            apply(0)
            store.set({ state: 'pulling' })
            return true
          }
          // 아직 최상단이 아니면 기준점을 계속 끌어와, 최상단 도달 즉시 0부터 당겨진다.
          if (scroller.scrollTop > 0) startY = y
          return false
        }
        const delta = y - startY
        if (delta <= 0) {
          current = 0
          apply(0)
          pulling = false
          store.set({ state: 'idle' })
          return false
        }
        current = resist(delta)
        apply(current)
        store.set({ state: current >= threshold ? 'armed' : 'pulling' })
        return true
      }

      const settleBack = () => {
        store.set({ state: 'idle', transition: true })
        apply(0)
        settleTimer = window.setTimeout(() => {
          reset()
          store.set({ transition: false })
        }, SETTLE_MS)
      }

      const runRefresh = async () => {
        refreshing = true
        current = resting
        store.set({ state: 'refreshing', transition: true })
        apply(resting)
        try {
          navigator.vibrate?.(8)
        } catch {
          /* 미지원 브라우저 무시 */
        }
        try {
          await refreshRef.current()
        } finally {
          refreshing = false
          settleBack()
        }
      }

      const end = () => {
        if (!pulling && current === 0) return
        const shouldRefresh = pulling && current >= threshold && !refreshing
        pulling = false
        if (shouldRefresh) void runRefresh()
        else settleBack()
      }

      // ── 터치 — touchmove 는 non-passive 여야 네이티브 바운스를 막을 수 있다 ──
      const onTouchStart = (event: TouchEvent) => {
        if (refreshing || event.touches.length !== 1) return
        begin(event.touches[0].clientX, event.touches[0].clientY)
      }
      const onTouchMove = (event: TouchEvent) => {
        if (refreshing) return
        if (move(event.touches[0].clientX, event.touches[0].clientY, event.target))
          event.preventDefault()
      }

      // ── 마우스 드래그 — 데스크톱 미리보기에서도 제스처를 확인할 수 있게 ──
      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || refreshing) return
        mouseId = event.pointerId
        begin(event.clientX, event.clientY)
      }
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerId !== mouseId || refreshing) return
        const wasPulling = pulling
        if (move(event.clientX, event.clientY, event.target)) {
          if (!wasPulling) scroller.setPointerCapture(event.pointerId)
          event.preventDefault()
        }
      }
      const onPointerUp = (event: PointerEvent) => {
        if (event.pointerId !== mouseId) return
        mouseId = null
        if (scroller.hasPointerCapture(event.pointerId))
          scroller.releasePointerCapture(event.pointerId)
        end()
      }

      scroller.addEventListener('touchstart', onTouchStart, { passive: true })
      scroller.addEventListener('touchmove', onTouchMove, { passive: false })
      scroller.addEventListener('touchend', end, { passive: true })
      scroller.addEventListener('touchcancel', end, { passive: true })
      scroller.addEventListener('pointerdown', onPointerDown)
      scroller.addEventListener('pointermove', onPointerMove)
      scroller.addEventListener('pointerup', onPointerUp)
      scroller.addEventListener('pointercancel', onPointerUp)
      return () => {
        scroller.removeEventListener('touchstart', onTouchStart)
        scroller.removeEventListener('touchmove', onTouchMove)
        scroller.removeEventListener('touchend', end)
        scroller.removeEventListener('touchcancel', end)
        scroller.removeEventListener('pointerdown', onPointerDown)
        scroller.removeEventListener('pointermove', onPointerMove)
        scroller.removeEventListener('pointerup', onPointerUp)
        scroller.removeEventListener('pointercancel', onPointerUp)
        window.clearTimeout(settleTimer)
        reset()
        store.set({ state: 'idle', transition: false })
      }
    }, [scroller, enabled, threshold, maxPull, resting, store])

    return (
      <PullToRefreshProvider store={store} setScroller={setScroller}>
        <Primitive.div data-enabled={enabled ? '' : undefined} {...rootProps} ref={composedRef} />
      </PullToRefreshProvider>
    )
  }
)
PullToRefreshRoot.displayName = ROOT_NAME

const SCROLLER_NAME = 'PullToRefreshScroller'

/** 제스처를 받는 스크롤러. overflow-y:auto · overscroll-behavior-y:contain 은 인라인으로 강제한다. */
const PullToRefreshScroller = React.forwardRef<HTMLDivElement, PrimitiveDivProps>(
  (props, forwardedRef) => {
    const { style, ...scrollerProps } = props
    const context = usePullToRefreshContext(SCROLLER_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.setScroller)
    return (
      <Primitive.div
        {...scrollerProps}
        ref={composedRef}
        style={{ overflowY: 'auto', overscrollBehaviorY: 'contain', ...style }}
      />
    )
  }
)
PullToRefreshScroller.displayName = SCROLLER_NAME

const INDICATOR_NAME = 'PullToRefreshIndicator'

interface PullToRefreshIndicatorProps extends Omit<PrimitiveDivProps, 'children'> {
  children?: React.ReactNode | ((snapshot: PullSnapshot) => React.ReactNode)
}

/** 상태를 data-* 로 알리는 인디케이터 컨테이너. 위치·모양은 소비 CSS 가 `var(--ptr-pull)` 로 그린다. */
const PullToRefreshIndicator = React.forwardRef<HTMLDivElement, PullToRefreshIndicatorProps>(
  (props, forwardedRef) => {
    const { children, ...indicatorProps } = props
    const { store } = usePullToRefreshContext(INDICATOR_NAME)
    const snapshot = React.useSyncExternalStore(store.subscribe, store.get, store.get)
    return (
      <Primitive.div
        role="status"
        aria-live="polite"
        data-state={snapshot.state}
        data-transition={snapshot.transition ? '' : undefined}
        {...indicatorProps}
        ref={forwardedRef}
      >
        {typeof children === 'function' ? children(snapshot) : children}
      </Primitive.div>
    )
  }
)
PullToRefreshIndicator.displayName = INDICATOR_NAME

/* ---------------------------------------------------------------------------------------------- */

const Root = PullToRefreshRoot
const Scroller = PullToRefreshScroller
const Indicator = PullToRefreshIndicator

export {
  PullToRefreshRoot,
  PullToRefreshScroller,
  PullToRefreshIndicator,
  //
  Root,
  Scroller,
  Indicator,
}
export type { PullToRefreshRootProps, PullToRefreshIndicatorProps, PullState, PullSnapshot }
