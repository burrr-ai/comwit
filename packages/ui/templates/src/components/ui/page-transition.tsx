'use client'

/**
 * PageTransition — 라우트가 바뀔 때 페이지가 네이티브 앱처럼 움직인다(드릴·시트·슬라이드 …).
 *
 * 라우터는 그대로 두고, 라우트마다 바뀌는 DOM 경계에 <PageBoundary> 를 하나 두면 된다.
 * 엔진은 그 경계가 사라지고 나타나는 순간을 관찰해 나가는 페이지를 잠시 붙잡아 두고 애니메이션한다.
 *
 *   const transitions = {
 *     transitions: [
 *       { on: '/posts/**', except: '/posts', transition: drill() },  // 목록 → 상세
 *       { on: '/compose', transition: sheet({ type: 'blur' }) },      // 임시 작업
 *       { ordered: ['/home', '/search', '/me'], transition: slide() }, // 탭
 *     ],
 *   } satisfies PageTransitionConfig
 *
 *   <PageTransition config={transitions}>
 *     <PageBoundary path={pathname}>{children}</PageBoundary>
 *   </PageTransition>
 *
 *  - <PageTransition>   앱 루트에 한 번. 레이아웃만 맡는 쉘(flex 열)을 깐다 — 경계가 grow 로 쉘 높이를 채운다.
 *                       퍼센트 min-height 는 높이가 auto 인 부모에서 풀리지 않으므로 짧은 페이지의 sticky 탭바가
 *                       바닥에 서려면 이 배선이 필요하다. 기준점·스태킹·가로 자르기는 쉘이 아니라 스크롤러 몫이다(아래 "스크롤러").
 *  - <PageBoundary>     라우트가 소유한 DOM. path = 규칙이 매칭하는 논리 경로, routeKey = DOM 수명(생략 시 path).
 *                       key 가 바뀌면 React 가 언마운트·마운트하고 엔진이 그 교체를 전환으로 바꾼다 — 라우터 없이
 *                       상태값(`const [path, setPath] = useState('/notes')`)으로도 똑같이 돈다.
 *                       기본 grow + min-h-full: 흐름 안에선 쉘을 채우고, 나가는 동안(absolute)엔 쉘 높이를 유지해
 *                       sticky 탭바·액션바가 바닥에 머문다.
 *  - <RouteBoundary>    (route-boundary.tsx · CLI 가 라우터를 감지해 설치) 라우터의 pathname 을 대신 읽는 <PageBoundary>.
 *                       Next.js · TanStack Router 는 ssgoi 공식 어댑터(@ssgoi/react/nextjs · /tanstack-router)를 감싼다.
 *
 * 앱바는 페이지 안(경계 안)에 둔다 — 페이지와 함께 움직이는 것이 앱의 감각이다. 살아남는 쉘은 탭바처럼 페이지
 * **아래**에 오는 것만 갖고, 바깥 경계의 routeKey 를 고정한 채 안쪽 경계가 페이지를 바꾼다:
 *
 *   <PageBoundary routeKey="tabs" className="flex min-h-full flex-col">
 *     <PageBoundary path={pathname} className="flex-1">      ← 페이지(앱바 포함)
 *       <AppBar … />
 *       {children}
 *     </PageBoundary>
 *     <BottomNav … />
 *   </PageBoundary>
 *
 * 스크롤러 — 나가는 페이지는 가장 가까운 positioned 조상의 윗변에 absolute 로 놓인다. 그 기준점·스태킹 컨텍스트·
 * 가로 자르기를 스크롤러 하나가 맡는다(네이티브 앱 쉘과 같은 구조):
 *
 *   <main className="relative z-0 min-h-0 flex-1 overflow-x-clip overflow-y-auto">   ← 앱의 유일한 스크롤러
 *     <PageTransition config={transitions} className="min-h-full">…</PageTransition>
 *   </main>
 *
 * 문서가 스크롤되면 `<body className="relative z-0 overflow-x-clip">` 로 둔다. clip 이어야 한다 — hidden 은 스크롤
 * 컨테이너를 만들어 sticky 와 스크롤 복원을 끊는다. PageTransition 은 스크롤러의 맨 위에 둔다(위에 다른 것을 두면
 * PageTransition 을 relative 부모로 감싼다). 스크롤러와 sticky 탭바 사이에는 overflow 를 가진 조상을 두지 않는다 —
 * 끼면 iOS WebKit 이 sticky 를 스크롤 스레드에서 맞추지 못해 스크롤 중 탭바가 떨린다.
 *
 * 규칙: on/except(계층 진입·이탈) · from/to(정확한 쌍) · ordered(탭 순서). 뒤로가기는 같은 효과를 거꾸로 돈다.
 * 스크롤 위치는 규칙에서 자동으로 복원·초기화된다.
 * hero 는 두 페이지의 공유 요소에 `data-hero-exit-key`(출발) / `data-hero-enter-key`(도착) 를 같은 값으로 달고,
 * 양쪽에 `data-hero-radius`(모서리 반경 px) 도 적는다 — 엔진은 CSS 반경을 읽지 않으므로 이 값으로 전환 중 반경을 보정한다.
 */

import * as React from 'react'
import { Ssgoi, type SsgoiConfig } from '@ssgoi/react'
import { axis, drill } from '@ssgoi/react/view-transitions'

import { cn } from '../../lib/utils'

/** 전환 규칙 — `transitions` 배열(또는 `({ isMobile }) => 배열`)과 선택적 `middleware` · `scrollLock`. */
export type PageTransitionConfig = SsgoiConfig

type PageTransitionProps = React.ComponentProps<'div'> & {
  config: PageTransitionConfig
  children: React.ReactNode
}

/**
 * 앱 루트(라우팅되는 영역의 바깥)에 한 번 둔다. 쉘은 문서 스크롤 기준(min-h-dvh)이며,
 * 자체 스크롤러 안에서 쓰면 `className="min-h-full"` 처럼 높이만 바꾼다. 가로 자르기는 스크롤러 몫이다(위 "스크롤러").
 */
function PageTransition({ config, className, children, ...props }: PageTransitionProps) {
  return (
    <div
      data-slot="page-transition"
      // 레이아웃만: 기준점(relative)·스태킹(z-0)·가로 자르기(overflow-x-clip)는 스크롤러가 갖는다.
      // 쉘에 overflow 가 있으면 sticky 탭바와 스크롤러 사이에 끼어 iOS 에서 탭바가 떨린다.
      className={cn('flex min-h-dvh flex-col', className)}
      {...props}
    >
      <Ssgoi config={config}>{children}</Ssgoi>
    </div>
  )
}

export type PageBoundaryProps<T extends React.ElementType = 'div'> = {
  /** 전환 규칙이 매칭하는 논리 경로. 보통 라우터의 pathname. */
  path: string
  /** DOM 수명. 생략하면 path. 헤더·탭바가 살아남는 쉘이면 고정 문자열을 준다. */
  routeKey?: string | number
  as?: T
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'children' | 'path' | 'routeKey'>

/**
 * 라우트가 소유한 DOM 경계. key 가 바뀌면 React 가 이 요소를 새로 만들고, 엔진이 그 교체를 전환으로 바꾼다.
 * 렌더와 같은 순간에 path·routeKey 를 계산한다 — effect 로 미루면 옛 페이지가 먼저 사라진다.
 */
function PageBoundary<T extends React.ElementType = 'div'>({
  path,
  routeKey,
  as,
  children,
  ...props
}: PageBoundaryProps<T>) {
  const Component: React.ElementType = as ?? 'div'
  const { className, ...rest } = props as { className?: string }
  return (
    <Component
      {...rest}
      key={routeKey ?? path}
      data-slot="page-boundary"
      data-ssgoi-transition={path}
      // grow: 흐름 안에서 쉘(flex 열)을 채운다. min-h-full: 나가는 동안(absolute, 쉘이 기준)에도 쉘 높이를 유지한다.
      // 둘 다 없으면 짧은 페이지가 줄어들어 sticky 탭바·액션바가 위로 올라온다.
      className={cn('min-h-full grow', className)}
    >
      {children}
    </Component>
  )
}

type TransitionRules = Extract<NonNullable<PageTransitionConfig['transitions']>, readonly unknown[]>

/**
 * 모바일 앱 기본 규칙 — 탭 ↔ 탭은 탭 순서대로 가로 축(바깥 경계 key 가 같아 탭바는 멈춰 있다), 그 밖의 모든 진입은
 * drill(브라우저 뒤로가기는 거꾸로). 화면 관계가 다른 규칙은 `transitions` 로 끼운다 — fallback 보다 구체적이라 이긴다.
 *
 *   appTransitions(APP_TAB_PATHS, {
 *     transitions: [{ on: ['/compose', '/posts/new'], transition: sheet({ type: 'static' }) }],
 *   })
 *
 * 별칭이 없는 앱은 경로를 그대로 쓴다(`/posts/1` 과 `/posts/2` 를 하나로 합치지 않는다). 전환 중 스크롤러의 사용자
 * 스크롤 입력은 잠근다(scrollLock 기본) — 앱이 입력을 직접 관리할 때만 false.
 */
function appTransitions(
  tabPaths: readonly string[],
  extra: { transitions?: TransitionRules; scrollLock?: boolean } = {}
): PageTransitionConfig {
  const tabs = [...tabPaths]
  return {
    middleware: (from, to) => ({ from, to }),
    ...(extra.scrollLock === undefined ? {} : { scrollLock: extra.scrollLock }),
    transitions: [
      { ordered: tabs, transition: axis({ type: 'x', feel: 'snappy' }) },
      ...(extra.transitions ?? []),
      { priority: -100, on: '/**', except: tabs, transition: drill() },
    ],
  }
}

export { PageTransition, PageBoundary, appTransitions }

// 전환 프리셋 — 이름은 UX 의도다. 더 많은 효과(film · strip · rotate …)는 '@ssgoi/react/view-transitions' 에.
//   drill  목록 → 상세(계층)     sheet  작성·필터 같은 임시 작업     slide  순서 있는 탭
//   axis   머티리얼 공유축       zoom   카드가 상세로 확대            hero   두 페이지가 공유하는 요소
//   fade   조용한 순차 페이드
export { drill, sheet, slide, axis, zoom, hero, fade } from '@ssgoi/react/view-transitions'
