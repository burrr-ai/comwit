'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

const TOP_EDGE = 12
const COLLAPSE_AFTER = 72
const DOWN_DISTANCE = 18
const UP_DISTANCE = 6
const TOUCH_INTENT_SLOP = 6
const USER_SCROLL_IDLE_MS = 180

type ScrollChromeValue = {
  /** 사용자가 아래로 충분히 스크롤했다 — 앱바는 숨고(reveal) 바텀내비는 작아진다. */
  compact: boolean
  /** 즉시 원래 크기로 되돌린다(탭바를 누르거나 포커스가 들어올 때). */
  expand: () => void
}

const ScrollChromeContext = createContext<ScrollChromeValue>({
  compact: false,
  expand: () => undefined,
})

/**
 * 모바일 앱 크롬(앱바·바텀내비)의 스크롤 의도를 한 번만 판정해 공유한다.
 *
 * 앱바와 탭바가 각자 리스너를 달면 감도와 전환 시점이 어긋나므로, 누적 이동량에 히스테리시스를
 * 적용해 compact 하나로 묶는다. 라우팅의 스크롤 복원처럼 브라우저가 직접 바꾼 위치는 무시하고,
 * 실제 세로 터치 제스처나 휠 입력이 선행된 스크롤만 반영한다.
 *
 *   <ScrollChromeProvider scrollRef={mainRef} resetKey={pathname}>…</ScrollChromeProvider>
 *
 * scrollRef 를 생략하면 문서(window) 스크롤을 본다. resetKey 가 바뀌면(라우트 전환) 펼친다.
 */
export function ScrollChromeProvider({
  scrollRef,
  resetKey,
  children,
}: {
  scrollRef?: RefObject<HTMLElement | null>
  resetKey?: unknown
  children: ReactNode
}) {
  const [compact, setCompact] = useState(false)
  const expand = useCallback(() => setCompact(false), [])

  useEffect(() => {
    setCompact(false)
  }, [resetKey])

  useEffect(() => {
    const element = scrollRef ? scrollRef.current : null
    if (scrollRef && !element) return
    const target: HTMLElement | Window = element ?? window
    const getTop = () => (element ? element.scrollTop : window.scrollY)

    let lastTop = getTop()
    let direction: -1 | 0 | 1 = 0
    let distance = 0
    let frame = 0
    let touchActive = false
    let touchStartX = 0
    let touchStartY = 0
    let userScrollIntent = false
    let intentTimer = 0

    const clearIntentTimer = () => {
      if (!intentTimer) return
      window.clearTimeout(intentTimer)
      intentTimer = 0
    }
    const disarm = () => {
      clearIntentTimer()
      userScrollIntent = false
    }
    const arm = () => {
      clearIntentTimer()
      userScrollIntent = true
    }
    const scheduleIntentEnd = () => {
      clearIntentTimer()
      intentTimer = window.setTimeout(() => {
        intentTimer = 0
        userScrollIntent = false
      }, USER_SCROLL_IDLE_MS)
    }

    const measure = () => {
      frame = 0
      const currentTop = getTop()
      const delta = currentTop - lastTop
      lastTop = currentTop

      if (!userScrollIntent) {
        direction = 0
        distance = 0
        return
      }
      if (currentTop <= TOP_EDGE) {
        direction = 0
        distance = 0
        setCompact(false)
        return
      }
      if (Math.abs(delta) < 0.5) return
      const nextDirection: -1 | 1 = delta > 0 ? 1 : -1
      if (nextDirection !== direction) {
        direction = nextDirection
        distance = 0
      }
      distance += Math.abs(delta)

      if (direction === 1 && currentTop > COLLAPSE_AFTER && distance >= DOWN_DISTANCE) {
        setCompact(true)
        distance = 0
      } else if (direction === -1 && distance >= UP_DISTANCE) {
        setCompact(false)
        distance = 0
      }
      if (!touchActive) scheduleIntentEnd()
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }
    const onTouchStart = (event: Event) => {
      const touches = (event as TouchEvent).touches
      disarm()
      direction = 0
      distance = 0
      lastTop = getTop()
      if (touches.length !== 1) {
        touchActive = false
        return
      }
      touchActive = true
      touchStartX = touches[0].clientX
      touchStartY = touches[0].clientY
    }
    const onTouchMove = (event: Event) => {
      const touches = (event as TouchEvent).touches
      if (!touchActive || touches.length !== 1 || userScrollIntent) return
      const dx = touches[0].clientX - touchStartX
      const dy = touches[0].clientY - touchStartY
      if (Math.abs(dy) < TOUCH_INTENT_SLOP || Math.abs(dy) <= Math.abs(dx)) return
      arm()
    }
    const onTouchEnd = () => {
      touchActive = false
      if (userScrollIntent) scheduleIntentEnd()
    }
    const onTouchCancel = () => {
      touchActive = false
      disarm()
    }
    const onWheel = () => {
      // lastTop 은 건드리지 않는다 — passive 휠은 컴포지터가 먼저 스크롤해버려서, 여기서 다시 읽으면
      // 이미 움직인 위치가 기준이 되어 한 칸짜리 휠 입력이 통째로 사라진다.
      // (프로그램 스크롤로 바뀐 위치는 measure 가 매 스크롤마다 lastTop 에 반영해 둔다.)
      if (!userScrollIntent) {
        direction = 0
        distance = 0
      }
      touchActive = false
      arm()
      scheduleIntentEnd()
    }
    // 키보드 스크롤(Space·PageDown·방향키)도 사용자 의도다.
    const onKeyDown = (event: Event) => {
      const key = (event as KeyboardEvent).key
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(key)) {
        arm()
        scheduleIntentEnd()
      }
    }

    const passive = { passive: true } as const
    target.addEventListener('touchstart', onTouchStart, passive)
    target.addEventListener('touchmove', onTouchMove, passive)
    target.addEventListener('touchend', onTouchEnd, passive)
    target.addEventListener('touchcancel', onTouchCancel, passive)
    target.addEventListener('wheel', onWheel, passive)
    target.addEventListener('keydown', onKeyDown, passive)
    target.addEventListener('scroll', onScroll, passive)
    return () => {
      target.removeEventListener('touchstart', onTouchStart)
      target.removeEventListener('touchmove', onTouchMove)
      target.removeEventListener('touchend', onTouchEnd)
      target.removeEventListener('touchcancel', onTouchCancel)
      target.removeEventListener('wheel', onWheel)
      target.removeEventListener('keydown', onKeyDown)
      target.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      clearIntentTimer()
    }
  }, [scrollRef])

  const value = useMemo(() => ({ compact, expand }), [compact, expand])
  return (
    <ScrollChromeContext.Provider value={value}>
      <div className="contents" data-scroll-chrome={compact ? 'compact' : 'expanded'}>
        {children}
      </div>
    </ScrollChromeContext.Provider>
  )
}

/** 가장 가까운 ScrollChromeProvider 의 상태. 프로바이더가 없으면 항상 펼쳐진 상태다. */
export function useScrollChrome() {
  return useContext(ScrollChromeContext)
}
