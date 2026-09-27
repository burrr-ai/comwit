'use client'

/**
 * comwit-ui — nav-depth (헤드리스 · 라우터 무관).
 *
 * "뒤로 갈 곳이 **앱 안에** 있는가"를 안다. 앱이 떠 있는 동안 history.pushState 를 감싸 항목마다 깊이를 찍고,
 * 뒤로가기·닫기 버튼은 그 깊이로 판단한다 — 있으면 back, 없으면(공유 링크·새로고침·PWA 실행으로 상세에 바로 들어옴)
 * 논리 부모 URL 로 replace 한다. 그래야 back 이 앱 밖으로 튀어나가지 않고, 부모로 대신 간 뒤에도 back 루프가 생기지 않는다.
 *
 *   <NavDepthProvider router={{ back: () => router.back(), replace: (href) => router.replace(href) }}>…</NavDepthProvider>
 *   const back = useBackNavigation('/posts')   // <AppBarBackButton onClick={back} />
 *
 * router 를 생략하면 history.back() · location.replace() 다(전체 로드). 라우터가 있으면 소프트 내비를 넘긴다 —
 * 어댑터 객체는 메모이즈해서 넘긴다. 프로바이더는 라우트 경계 **바깥**에 한 번 둔다(페이지와 함께 리마운트되면 깊이가 초기화된다).
 * history.length · referrer 로는 앱 안의 이전 항목을 증명할 수 없어 새로 뜬 앱은 깊이 0 에서 시작한다.
 */

import * as React from 'react'

type NavDepthRouter = {
  back: () => void
  replace: (href: string) => void
}

type HistoryPort = Pick<History, 'state' | 'pushState' | 'replaceState'>
type Entry = { session: string; depth: number }

const ENTRY_KEY = '__comwitAppNavigation'

const DEFAULT_ROUTER: NavDepthRouter = {
  back: () => window.history.back(),
  replace: (href) => window.location.replace(href),
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** randomUUID 는 보안 컨텍스트 전용(http://<LAN IP> 로 폰에서 열면 없다). getRandomValues 는 어디서나 된다. */
function createSessionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

/** 실제 항목(쿼리만 바뀌는 push 포함)을 세되 라우터의 state 키는 건드리지 않는다. */
function installNavigationHistory(history: HistoryPort, session: string) {
  const originalPush = history.pushState
  const originalReplace = history.replaceState
  let active = true

  const read = (): Entry | undefined => {
    const entry = record(record(history.state)[ENTRY_KEY])
    return entry.session === session &&
      typeof entry.depth === 'number' &&
      Number.isSafeInteger(entry.depth) &&
      entry.depth >= 0
      ? { session, depth: entry.depth }
      : undefined
  }
  const stamp = (data: unknown, depth: number) => ({
    ...record(data),
    [ENTRY_KEY]: { session, depth },
  })

  // 새로 뜬 앱(전체 로드·리마운트)은 새 세션이다 — 브라우저가 옛 state 를 남겨 뒀어도 깊이 0.
  originalReplace.call(history, stamp(history.state, 0), '')

  function pushState(data: unknown, unused: string, url?: string | URL | null) {
    const current = read()
    originalPush.call(
      history,
      active ? stamp(data, current ? current.depth + 1 : 0) : data,
      unused,
      url
    )
  }
  function replaceState(data: unknown, unused: string, url?: string | URL | null) {
    originalReplace.call(history, active ? stamp(data, read()?.depth ?? 0) : data, unused, url)
  }
  history.pushState = pushState
  history.replaceState = replaceState

  return {
    // 누르는 순간 읽는다 — 브라우저 앞으로/뒤로는 그 항목의 도장을 복원한다.
    canGoBack: () => active && (read()?.depth ?? 0) > 0,
    dispose() {
      active = false
      // 우리 뒤에 다른 래퍼(라우터·브리지)가 설치됐을 수 있다. 그건 두고, 우리 래퍼로 남은 호출은 통과시킨다.
      if (history.pushState === pushState) history.pushState = originalPush
      if (history.replaceState === replaceState) history.replaceState = originalReplace
    },
  }
}

type NavDepthContextValue = {
  canGoBack: () => boolean
  router: NavDepthRouter
}

const NavDepthContext = React.createContext<NavDepthContextValue>({
  canGoBack: () => false,
  router: DEFAULT_ROUTER,
})
NavDepthContext.displayName = 'NavDepthContext'

interface NavDepthProviderProps {
  /** 소프트 내비 어댑터. 생략하면 history.back() · location.replace(). */
  router?: NavDepthRouter
  children: React.ReactNode
}

function NavDepthProvider({ router, children }: NavDepthProviderProps) {
  const tracker = React.useRef<ReturnType<typeof installNavigationHistory> | null>(null)
  React.useEffect(() => {
    const navigation = installNavigationHistory(window.history, createSessionId())
    tracker.current = navigation
    return () => {
      navigation.dispose()
      tracker.current = null
    }
  }, [])
  const canGoBack = React.useCallback(() => tracker.current?.canGoBack() ?? false, [])
  const value = React.useMemo(
    () => ({ canGoBack, router: router ?? DEFAULT_ROUTER }),
    [canGoBack, router]
  )
  return <NavDepthContext.Provider value={value}>{children}</NavDepthContext.Provider>
}
NavDepthProvider.displayName = 'NavDepthProvider'

/** 뒤로가기·닫기 버튼의 onClick — 앱 안 히스토리가 있으면 back, 직접 진입이면 fallback 으로 replace. */
function useBackNavigation(fallback: string): () => void {
  const { canGoBack, router } = React.useContext(NavDepthContext)
  return React.useCallback(() => {
    if (canGoBack()) router.back()
    else router.replace(fallback)
  }, [canGoBack, router, fallback])
}

/** 직접 판단하는 컨트롤용 getter. 렌더 중이 아니라 이벤트 핸들러에서 부른다. */
function useCanGoBack(): () => boolean {
  return React.useContext(NavDepthContext).canGoBack
}

export { NavDepthProvider, useBackNavigation, useCanGoBack }
export type { NavDepthProviderProps, NavDepthRouter }
