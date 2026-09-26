'use client'

/**
 * AppScreen — 화면 하나 = 앱바 + 본문. 앱바는 라우트 경계(페이지) 안에 있어 페이지와 함께 움직인다 — 여기서 경계를 더 만들지 않는다.
 *
 *  - bar="tab"    탭 루트. 제목·액션이 없으면 상단 safe-area 여백만 남긴다. 앱바는 flow(스크롤과 함께 올라간다).
 *  - bar="back"   상세. 유리 뒤로가기 — 앱 안 히스토리가 있으면 back, 직접 진입이면 fallback 으로 replace. 앱바는 reveal.
 *  - bar="sheet"  임시 작업(작성·선택). 오른쪽 X 닫기. 앱바는 pinned.
 *  - bar="none"   앱바 없음(풀블리드 히어로 등 — FloatingBackButton 을 직접 둔다).
 *
 *   <AppScreen title="Home" actions={<Button size="icon" variant="ghost"><Bell /></Button>}>…</AppScreen>
 *   <DetailScreen fallback="/posts" title={post.title}>…</DetailScreen>
 *
 * DetailScreen 은 상세용 별칭 — bar 대신 variant("back" | "sheet")를 받고 하단 safe-area 를 더한다.
 * 뒤로가기 판단은 @comwit/ui 의 NavDepth(AppShell 이 깔아 둔다). 상단 safe-area 값(--app-safe-area-top)은 AppShell 이 정한다 —
 * 위에 배너가 붙어 있으면 0 이다.
 */

import * as React from 'react'
import { useBackNavigation } from '@comwit/ui'

import {
  AppBar,
  AppBarActions,
  AppBarBackButton,
  AppBarTitle,
  type AppBarBehavior,
} from './app-bar'
import { cn } from '../../lib/utils'

export type AppScreenBar = 'tab' | 'back' | 'sheet' | 'none'

type AppScreenProps = {
  children: React.ReactNode
  bar?: AppScreenBar
  title?: string
  /** 제목 자리를 대신하는 노드(검색창·세그먼트 등). */
  leading?: React.ReactNode
  actions?: React.ReactNode
  /** 직접 진입해 돌아갈 히스토리가 없을 때 이동할 논리 부모 URL. */
  fallback?: string
  /** 기본은 tab=flow · back=reveal · sheet=pinned. */
  appBarBehavior?: AppBarBehavior
  className?: string
}

function AppScreen({
  children,
  bar = 'tab',
  title,
  leading,
  actions,
  fallback = '/',
  appBarBehavior,
  className,
}: AppScreenProps) {
  const back = useBackNavigation(fallback)
  const behavior =
    appBarBehavior ?? (bar === 'back' ? 'reveal' : bar === 'sheet' ? 'pinned' : 'flow')
  const empty = bar === 'none' || (bar === 'tab' && !title && !leading && !actions)

  return (
    <div
      data-slot="app-screen"
      className={cn('relative flex flex-1 flex-col bg-background', className)}
    >
      {empty ? (
        <div
          className="h-[var(--app-safe-area-top,env(safe-area-inset-top))] shrink-0"
          aria-hidden="true"
        />
      ) : (
        <AppBar behavior={behavior}>
          {bar === 'back' ? <AppBarBackButton onClick={back} /> : null}
          {leading ??
            (title ? <AppBarTitle size={bar === 'tab' ? 'lg' : 'md'}>{title}</AppBarTitle> : null)}
          {actions || bar === 'sheet' ? (
            <AppBarActions>
              {actions}
              {bar === 'sheet' ? <AppBarBackButton icon="close" onClick={back} /> : null}
            </AppBarActions>
          ) : null}
        </AppBar>
      )}
      <div className="flex-1">{children}</div>
    </div>
  )
}

type DetailScreenProps = Omit<AppScreenProps, 'bar' | 'fallback'> & {
  variant?: 'back' | 'sheet'
  /** 페이지가 정한 논리 부모 URL. 직접 진입 뒤 뒤로가기에 필요하다. */
  fallback: string
}

/** 전체 화면 상세 — 일반 경로와 인터셉트 경로가 같은 래퍼를 쓴다. */
function DetailScreen({ variant = 'back', className, ...props }: DetailScreenProps) {
  return (
    <AppScreen
      {...props}
      bar={variant}
      className={cn('pb-[env(safe-area-inset-bottom)]', className)}
    />
  )
}

export { AppScreen, DetailScreen }
