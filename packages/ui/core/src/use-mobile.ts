'use client'

/**
 * comwit-ui — 모바일 감지 훅 (헤드리스).
 * 피커(팝오버 ↔ 바텀시트)·토스트(상단 ↔ 우하단)처럼 화면 크기로 표현을 고르는 컴포넌트가 쓴다.
 */

import * as React from 'react'

interface UseMobileResult {
  isMobile: boolean
  /** false 면 SSR 중이거나 아직 감지 전 — 스켈레톤을 그리거나 데스크톱 표현을 기본으로 둔다. */
  detected: boolean
}

/**
 * 화면 너비 기반 모바일 감지. `(max-width: breakpoint px)` 미디어 쿼리를 따른다.
 *
 * @param breakpoint 모바일로 간주할 최대 너비(기본 768)
 */
function useMobile(breakpoint: number = 768): UseMobileResult {
  const [state, setState] = React.useState<UseMobileResult>({ isMobile: false, detected: false })

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setState({ isMobile: mediaQuery.matches, detected: true })
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [breakpoint])

  return state
}

/** User Agent 기반 모바일 기기 감지 — 화면 크기가 아니라 실제 기기 종류. */
function useMobileDevice(): UseMobileResult {
  const [state, setState] = React.useState<UseMobileResult>({ isMobile: false, detected: false })

  React.useEffect(() => {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as { opera?: string }).opera || ''
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase()
    )
    setState({ isMobile: isMobileDevice, detected: true })
  }, [])

  return state
}

export { useMobile, useMobileDevice }
export type { UseMobileResult }
