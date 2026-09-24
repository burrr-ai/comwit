'use client'

/**
 * PullToRefresh — 스크롤 최상단에서 아래로 당겨 새로고침.
 *
 * 이 컴포넌트가 스크롤러(overflow-y-auto)를 직접 렌더한다. `ref` 는 그 스크롤러로 전달되므로
 * <ScrollChromeProvider scrollRef={ref}> 와 함께 쓰면 앱바·바텀내비가 같은 스크롤을 본다.
 *
 * ⚠️ **콘텐츠(스크롤러)는 절대 transform 하지 않는다.** 스크롤러 안에는 sticky 앱바·바텀내비가 산다.
 *    transform 을 걸면 스크롤러가 sticky/fixed 자손의 컨테이닝 블록이 되어 레이아웃이 깨진다.
 *    → 콘텐츠가 딸려 내려오는 대신 **스피너만** 위에서 내려온다(스크롤러 바깥 형제).
 *
 * 성능: 당기는 동안 리렌더 0. 스피너 위치·불투명도·회전은 CSS 변수(`--ptr-pull`)로만 움직이고,
 * React 상태(armed/refreshing)는 제스처당 1~2회, 인디케이터 잎만 리렌더한다.
 * 터치는 네이티브 바운스를 억제하고, 마우스는 드래그로도 당길 수 있다(데스크톱 미리보기용).
 */

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '../../lib/utils'

/** 이 당김 거리(px)를 넘겨서 놓으면 새로고침이 발동한다. */
const TRIGGER = 64
/** 고무줄 상한(px) — 아무리 당겨도 스피너가 이 이상 내려오지 않는다. */
const MAX_PULL = 130
/** 새로고침이 도는 동안 스피너가 안착할 위치(px). */
const RESTING = 60
/** 세로 당김으로 인정할 최소 이동(px) — 미세 터치/수평 스와이프 방지. */
const ENGAGE_SLOP = 8
/** 인디케이터 원의 지름(px). */
const DIAL = 34
const PULL_VAR = '--ptr-pull'

type PullToRefreshProps = Omit<React.ComponentProps<'div'>, 'ref'> & {
  /** 새로고침 작업. 반환한 Promise 가 끝날 때까지 스피너가 돈다. */
  onRefresh: () => Promise<unknown> | void
  /** false 면 제스처를 끈다(예: 데스크톱에서는 문서 스크롤). */
  enabled?: boolean
  /** 스크롤러 요소 ref — ScrollChromeProvider 에 넘긴다. */
  ref?: React.Ref<HTMLDivElement>
  /** 바깥 래퍼 className (스크롤러는 className) */
  wrapperClassName?: string
}

function PullToRefresh({
  onRefresh,
  enabled = true,
  ref,
  className,
  wrapperClassName,
  children,
  ...props
}: PullToRefreshProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const indicatorRef = React.useRef<PullIndicatorHandle>(null)
  const refreshRef = React.useRef(onRefresh)
  React.useImperativeHandle(ref, () => scrollerRef.current as HTMLDivElement, [])

  React.useEffect(() => {
    refreshRef.current = onRefresh
  }, [onRefresh])

  React.useEffect(() => {
    const scroller = scrollerRef.current
    const wrapper = wrapperRef.current
    if (!scroller || !wrapper || !enabled) return

    let startY = 0
    let startX = 0
    let pulling = false
    let refreshing = false
    let current = 0
    let mouseId: number | null = null

    const apply = (px: number) => wrapper.style.setProperty(PULL_VAR, `${px}`)
    const setSmooth = (on: boolean) => indicatorRef.current?.setTransition(on)
    const reset = () => wrapper.style.removeProperty(PULL_VAR)
    /** 고무줄 저항 — 당길수록 덜 내려오며 MAX_PULL 로 점근한다. */
    const resist = (dy: number) => MAX_PULL * (1 - Math.exp(-dy / MAX_PULL))

    /** target → scroller 사이에 위로 스크롤 여지가 있는 조상이 있으면 그쪽에 양보한다. */
    const yieldsToInnerScroll = (target: EventTarget | null) => {
      let el = target as HTMLElement | null
      while (el && el !== scroller) {
        if (el.scrollTop > 0) {
          const oy = getComputedStyle(el).overflowY
          if (oy === 'auto' || oy === 'scroll') return true
        }
        el = el.parentElement
      }
      return false
    }

    const begin = (x: number, y: number) => {
      startY = y
      startX = x
      pulling = false
      current = 0
      setSmooth(false)
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
          indicatorRef.current?.setArmed(false)
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
        return false
      }
      current = resist(delta)
      apply(current)
      indicatorRef.current?.setArmed(current >= TRIGGER)
      return true
    }

    const settleBack = () => {
      setSmooth(true)
      apply(0)
      indicatorRef.current?.setArmed(false)
      window.setTimeout(reset, 360)
    }

    const runRefresh = async () => {
      refreshing = true
      setSmooth(true)
      current = RESTING
      apply(RESTING)
      indicatorRef.current?.setRefreshing(true)
      try {
        navigator.vibrate?.(8)
      } catch {
        /* 미지원 브라우저 무시 */
      }
      try {
        await refreshRef.current()
      } finally {
        refreshing = false
        indicatorRef.current?.setRefreshing(false)
        settleBack()
      }
    }

    const end = () => {
      if (!pulling && current === 0) return
      const shouldRefresh = pulling && current >= TRIGGER && !refreshing
      pulling = false
      if (shouldRefresh) void runRefresh()
      else settleBack()
    }

    // ── 터치 — touchmove 는 non-passive 여야 네이티브 바운스를 막을 수 있다 ──
    const onTouchStart = (e: TouchEvent) => {
      if (refreshing || e.touches.length !== 1) return
      begin(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (refreshing) return
      if (move(e.touches[0].clientX, e.touches[0].clientY, e.target)) e.preventDefault()
    }

    // ── 마우스 드래그 — 데스크톱 미리보기에서도 제스처를 확인할 수 있게 ──
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || refreshing) return
      mouseId = e.pointerId
      begin(e.clientX, e.clientY)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== mouseId || refreshing) return
      const wasPulling = pulling
      if (move(e.clientX, e.clientY, e.target)) {
        if (!wasPulling) scroller.setPointerCapture(e.pointerId)
        e.preventDefault()
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== mouseId) return
      mouseId = null
      if (scroller.hasPointerCapture(e.pointerId)) scroller.releasePointerCapture(e.pointerId)
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
      reset()
    }
  }, [enabled])

  return (
    <div
      ref={wrapperRef}
      data-slot="pull-to-refresh"
      className={cn('relative flex min-h-0 flex-1 flex-col', wrapperClassName)}
    >
      <PullIndicator ref={indicatorRef} />
      <div
        ref={scrollerRef}
        className={cn(
          'relative z-0 min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

type PullIndicatorHandle = {
  setRefreshing: (v: boolean) => void
  setArmed: (v: boolean) => void
  setTransition: (v: boolean) => void
}

/** 상단 스피너 뱃지 — 위치·불투명도·회전은 전부 --ptr-pull 로 계산(당기는 동안 리렌더 없음). */
function PullIndicator({ ref }: { ref: React.Ref<PullIndicatorHandle> }) {
  const [refreshing, setRefreshing] = React.useState(false)
  const [armed, setArmed] = React.useState(false)
  const [transition, setTransition] = React.useState(false)
  const armedRef = React.useRef(false)

  React.useImperativeHandle(
    ref,
    () => ({
      setRefreshing,
      setArmed: (v: boolean) => {
        if (v === armedRef.current) return
        armedRef.current = v
        setArmed(v)
      },
      setTransition,
    }),
    []
  )

  const active = armed || refreshing

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-[env(safe-area-inset-top)] left-1/2 z-appbar"
      style={{
        // 당김 0 → 위로 숨김(-지름-10), 당길수록 내려온다.
        transform: `translate(-50%, calc(var(${PULL_VAR}, 0) * 1px - ${DIAL + 10}px))`,
        opacity: `clamp(0, calc(var(${PULL_VAR}, 0) / 40), 1)`,
        transition: transition
          ? 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease'
          : 'none',
        willChange: 'transform, opacity',
      }}
    >
      <span className="sr-only">{refreshing ? 'Refreshing' : ''}</span>
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-background shadow-panel ring-1 ring-border transition-transform duration-base',
          active && 'scale-105'
        )}
        style={{ width: DIAL, height: DIAL }}
      >
        <Loader2
          size={18}
          strokeWidth={2.5}
          aria-hidden="true"
          className={cn(
            'transition-colors',
            active ? 'text-primary' : 'text-subtle-foreground',
            refreshing && 'animate-spin'
          )}
          // 당기는 중엔 당김에 비례해 살짝 감긴다(발동 전 피드백). 도는 중엔 animate-spin 이 담당.
          style={refreshing ? undefined : { rotate: `calc(var(${PULL_VAR}, 0) * 2.6deg)` }}
        />
      </div>
    </div>
  )
}

export { PullToRefresh }
