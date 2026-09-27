'use client'

/**
 * comwit-ui — app-shell 프리미티브 (헤드리스 · 스타일 0).
 *
 * 모바일 앱의 **스크롤 뼈대** 한 묶음: 유일한 스크롤러(<main>) · 앱바(reveal)와 바텀내비(compact)가 공유하는 스크롤
 * 의도(ScrollChrome) · 당겨서 새로고침(PullToRefresh). 페이지 전환과 sticky 크롬이 기대는 구조 스타일을 스크롤러 하나에
 * 인라인으로 강제한다 — 소비처가 className 을 잘못 맞춰 나가는 페이지가 엉뚱한 기준에 붙거나, iOS 에서 스크롤 중
 * 탭바가 떨리는 일이 없다.
 *
 *   <AppShell.Root onRefresh={reload}>
 *     <AppShell.Indicator>{({ state }) => …}</AppShell.Indicator>
 *     <AppShell.Scroller>{pages}</AppShell.Scroller>
 *   </AppShell.Root>
 *
 *  - Root      ScrollChromeProvider + PullToRefresh.Root. 세로 flex 열이고 부모(폰 틀)의 남은 높이를 채운다(flex: 1 · min-height: 0).
 *              당김 거리 `--ptr-pull` 과 인디케이터의 absolute 기준(position: relative)이 여기다.
 *              onRefresh 가 없으면 당김 제스처는 꺼진다. resetKey 가 바뀌면(라우트 전환) 숨은 앱바·줄어든 탭바를 편다.
 *  - Scroller  <main> — 앱의 유일한 스크롤러이자 페이지 전환의 바닥. position: relative(나가는 페이지가 이 윗변에 붙잡힌다) ·
 *              z-index: 0(스태킹 컨텍스트) · overflow-x: clip(옆으로 나가는 페이지를 자른다) · overflow-y: auto ·
 *              overscroll-behavior-y: contain · 스크롤바 숨김. 이 요소와 안의 sticky 크롬 사이에 overflow 를 가진 조상을
 *              두지 않는다 — 끼면 iOS WebKit 이 sticky 를 스크롤 스레드에서 맞추지 못한다.
 *              **콘텐츠는 절대 transform 하지 않는다** — 안에 sticky 앱바·바텀내비가 살기 때문.
 *  - Indicator PullToRefresh.Indicator 그대로 — `data-state="idle | pulling | armed | refreshing"`.
 *
 * 폰 틀(높이·폭·배경)과 인디케이터 모양, 페이지 전환·라우트 경계 조립은 소비 레이어(템플릿 app-shell)가 갖는다.
 */

import * as React from 'react'

import { useComposedRefs } from './internal/compose-refs'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'
import {
  PullToRefreshIndicator,
  PullToRefreshRoot,
  PullToRefreshScroller,
  type PullToRefreshRootProps,
} from './pull-to-refresh'
import { ScrollChromeProvider } from './scroll-chrome'

const ROOT_NAME = 'AppShell'

type AppShellContextValue = {
  setScroller: (element: HTMLElement | null) => void
}
const [AppShellProvider, useAppShellContext] = createContext<AppShellContextValue>(ROOT_NAME)

interface AppShellRootProps extends Omit<PullToRefreshRootProps, 'onRefresh' | 'enabled'> {
  /** 당겨서 새로고침. 없으면 당김 제스처를 끈다. */
  onRefresh?: PullToRefreshRootProps['onRefresh']
  /** 바뀌면(라우트 전환) 숨은 앱바·줄어든 탭바를 편다. */
  resetKey?: unknown
}

/** 스크롤러가 남은 높이를 채우고, 인디케이터가 여기 기준으로 뜬다. */
const ROOT_STYLE: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  flex: '1 1 0%',
}

const noRefresh = () => undefined

const AppShellRoot = React.forwardRef<HTMLDivElement, AppShellRootProps>((props, forwardedRef) => {
  const { onRefresh, resetKey, style, ...rootProps } = props
  const [scroller, setScroller] = React.useState<HTMLElement | null>(null)
  // ref 객체를 스크롤러가 바뀔 때 새로 만든다 — ScrollChromeProvider 가 그때 다시 붙는다(Suspense 뒤에 마운트돼도 놓치지 않는다).
  const scrollRef = React.useMemo(() => ({ current: scroller }), [scroller])

  return (
    <AppShellProvider setScroller={setScroller}>
      <ScrollChromeProvider scrollRef={scrollRef} resetKey={resetKey}>
        <PullToRefreshRoot
          onRefresh={onRefresh ?? noRefresh}
          enabled={onRefresh != null}
          {...rootProps}
          ref={forwardedRef}
          style={{ ...ROOT_STYLE, ...style }}
        />
      </ScrollChromeProvider>
    </AppShellProvider>
  )
})
AppShellRoot.displayName = ROOT_NAME

const SCROLLER_NAME = 'AppShellScroller'

type PrimitiveMainProps = React.ComponentPropsWithoutRef<typeof Primitive.main>

/** 페이지 전환의 기준점·스태킹·가로 자르기와 스크롤 축. overflow-y · overscroll 은 PullToRefresh.Scroller 가 더한다. */
const SCROLLER_STYLE: React.CSSProperties = {
  position: 'relative',
  zIndex: 0,
  overflowX: 'clip',
  minHeight: 0,
  flex: '1 1 0%',
  scrollbarWidth: 'none',
}

const AppShellScroller = React.forwardRef<HTMLElement, PrimitiveMainProps>(
  (props, forwardedRef) => {
    const { style, ...scrollerProps } = props
    const context = useAppShellContext(SCROLLER_NAME)
    const composedRef = useComposedRefs(forwardedRef, context.setScroller)
    return (
      <PullToRefreshScroller asChild>
        <Primitive.main
          {...scrollerProps}
          ref={composedRef}
          style={{ ...SCROLLER_STYLE, ...style }}
        />
      </PullToRefreshScroller>
    )
  }
)
AppShellScroller.displayName = SCROLLER_NAME

const AppShellIndicator = PullToRefreshIndicator

/* ---------------------------------------------------------------------------------------------- */

const Root = AppShellRoot
const Scroller = AppShellScroller
const Indicator = AppShellIndicator

export {
  AppShellRoot,
  AppShellScroller,
  AppShellIndicator,
  //
  Root,
  Scroller,
  Indicator,
}
export type { AppShellRootProps }
