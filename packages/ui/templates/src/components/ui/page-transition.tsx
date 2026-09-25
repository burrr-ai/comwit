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
 *  - <PageTransition>   앱 루트에 한 번. 나가는 페이지가 제자리에 머물도록 쉘(relative · z-0 · overflow-x-clip)을 깐다.
 *                       overflow-x 는 hidden 이 아니라 clip 이어야 한다 — hidden 은 쉘을 스크롤 컨테이너로 만들어
 *                       스크롤 복원이 엉뚱한 요소를 겨눈다.
 *  - <PageBoundary>     라우트가 소유한 DOM. path = 규칙이 매칭하는 논리 경로, routeKey = DOM 수명(생략 시 path).
 *                       key 가 바뀌면 React 가 언마운트·마운트하고 엔진이 그 교체를 전환으로 바꾼다 — 라우터 없이
 *                       상태값(`const [path, setPath] = useState('/notes')`)으로도 똑같이 돈다.
 *  - <RouteBoundary>    (route-boundary.tsx · CLI 가 라우터를 감지해 설치) 라우터의 pathname 을 대신 읽는 <PageBoundary>.
 *
 * 살아남는 쉘(앱바·탭바)은 바깥 경계의 routeKey 를 고정하고 바뀌는 콘텐츠만 안쪽 경계로 감싼다. 이때 안쪽 경계는
 * **자기만의 positioned 부모**가 필요하다 — 나가는 페이지는 가장 가까운 positioned 조상의 윗변에 absolute 로
 * 놓이므로, 쉘에 바로 두면 앱바 높이만큼 위로 튄다:
 *
 *   <PageBoundary routeKey="tabs" className="flex min-h-full flex-col">
 *     <AppBar … />
 *     <div className="relative flex-1">                       ← 안쪽 경계의 자리(positioned)
 *       <PageBoundary path={pathname} className="min-h-full">{children}</PageBoundary>
 *     </div>
 *     <BottomNav … />
 *   </PageBoundary>
 *
 * 규칙: on/except(계층 진입·이탈) · from/to(정확한 쌍) · ordered(탭 순서). 뒤로가기는 같은 효과를 거꾸로 돈다.
 * 스크롤 위치는 규칙에서 자동으로 복원·초기화된다. `prefers-reduced-motion` 이면 전환 없이 바로 바꾼다.
 * hero 는 두 페이지의 공유 요소에 `data-hero-exit-key`(출발) / `data-hero-enter-key`(도착) 를 같은 값으로 단다.
 */

import * as React from 'react'
import { Ssgoi, type SsgoiConfig } from '@ssgoi/react'
import { useReducedMotion } from 'motion/react'

import { cn } from '../../lib/utils'

/** 전환 규칙 — `transitions` 배열(또는 `({ isMobile }) => 배열`)과 선택적 `middleware` · `scrollLock`. */
export type PageTransitionConfig = SsgoiConfig

const NO_TRANSITIONS: PageTransitionConfig = { transitions: [] }

type PageTransitionProps = React.ComponentProps<'div'> & {
  config: PageTransitionConfig
  /**
   * 모션 축소 선호 시의 동작. 기본 'none' 은 전환을 끄고 즉시 바꾼다.
   * 'keep' 은 설정을 그대로 쓴다(직접 fade 같은 조용한 규칙을 넣을 때).
   */
  reducedMotion?: 'none' | 'keep'
  children: React.ReactNode
}

/**
 * 앱 루트(라우팅되는 영역의 바깥)에 한 번 둔다. 쉘은 문서 스크롤 기준(min-h-dvh)이며,
 * 자체 스크롤러 안에서 쓰면 `className="min-h-full"` 처럼 높이만 바꾼다.
 */
function PageTransition({
  config,
  reducedMotion = 'none',
  className,
  children,
  ...props
}: PageTransitionProps) {
  const reduce = Boolean(useReducedMotion())
  const resolved = reduce && reducedMotion === 'none' ? NO_TRANSITIONS : config

  return (
    <div
      data-slot="page-transition"
      // overflow-x-clip: hidden 은 이 쉘을 스크롤 컨테이너로 만들어 스크롤 복원이 엉뚱한 요소를 겨눈다.
      className={cn('relative z-0 min-h-dvh overflow-x-clip', className)}
      {...props}
    >
      <Ssgoi config={resolved}>{children}</Ssgoi>
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
  return (
    <Component
      {...props}
      key={routeKey ?? path}
      data-slot="page-boundary"
      data-ssgoi-transition={path}
    >
      {children}
    </Component>
  )
}

export { PageTransition, PageBoundary }

// 전환 프리셋 — 이름은 UX 의도다. 더 많은 효과(film · strip · rotate …)는 '@ssgoi/react/view-transitions' 에.
//   drill  목록 → 상세(계층)     sheet  작성·필터 같은 임시 작업     slide  순서 있는 탭
//   axis   머티리얼 공유축       zoom   카드가 상세로 확대            hero   두 페이지가 공유하는 요소
//   fade   조용한 순차 페이드
export { drill, sheet, slide, axis, zoom, hero, fade } from '@ssgoi/react/view-transitions'
