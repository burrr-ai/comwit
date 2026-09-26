'use client'

/**
 * RouteBoundary — Next.js App Router 용. `comwit-ui add page-transition` 이 next 를 감지하면 이 파일을 설치한다.
 *
 * 구현은 ssgoi 공식 어댑터(`@ssgoi/react/nextjs` 의 SsgoiRouteBoundary)다 — usePathname 으로 논리 경로를,
 * useSelectedLayoutSegments 로 이 레이아웃이 소유한 슬롯을 읽고, URL 훅이 서스펜드할 수 있어(Cache Components)
 * Suspense 로 감싼다. 여기서는 <PageBoundary> 와 같은 기본 클래스(min-h-full grow)만 입힌다.
 *
 *   // app/layout.tsx — 라우팅되는 영역을 한 번 감싼다
 *   <PageTransition config={transitions}>
 *     <RouteBoundary>{children}</RouteBoundary>
 *   </PageTransition>
 *
 *   // 탭바가 살아남는 쉘: 바깥은 routeKey 고정, 안쪽이 페이지(앱바 포함)를 바꾼다. 앱바는 페이지 안에 둔다.
 *   <RouteBoundary routeKey="tabs" className="flex min-h-full flex-col">
 *     <RouteBoundary className="flex-1">{children}</RouteBoundary>
 *     <BottomNav … />
 *   </RouteBoundary>
 *
 * `resolve` 로 인터셉트 모달(@modal)처럼 URL 과 소유 슬롯이 다른 경우의 id/key 를 직접 정한다.
 */

import * as React from 'react'
import {
  SsgoiRouteBoundary,
  selectedSegmentsToPath,
  type NextjsRouteLocation,
  type SsgoiRouteBoundaryProps,
} from '@ssgoi/react/nextjs'

import { cn } from '../lib/utils'

/** pathname + 이 경계를 그리는 레이아웃 아래의 세그먼트(라우트 그룹 포함). */
export type RouteLocation = NextjsRouteLocation

/** resolve · routeKey · parallelRoutesKey · fallback · as + 요소 속성. */
export type RouteBoundaryProps<T extends React.ElementType = 'div'> = SsgoiRouteBoundaryProps<T>

function RouteBoundary<T extends React.ElementType = 'div'>(props: RouteBoundaryProps<T>) {
  const { className, ...rest } = props as { className?: string }
  return (
    <SsgoiRouteBoundary<T>
      {...(rest as RouteBoundaryProps<T>)}
      data-slot="page-boundary"
      // grow: 흐름 안에서 쉘(flex 열)을 채운다. min-h-full: 나가는 동안(absolute, 쉘이 기준)에도 쉘 높이를 유지한다.
      className={cn('min-h-full grow', className)}
    />
  )
}

/**
 * 레이아웃의 선택된 세그먼트를 논리 경로로 만든다. 라우트 그룹 `(group)` 과 인터셉트 표식 `(.)` 은 걷는다.
 * 중첩 레이아웃이면 그 레이아웃의 절대 경로를 basePath 로 준다. (ssgoi 의 selectedSegmentsToPath)
 */
const segmentsToPath = selectedSegmentsToPath

export { RouteBoundary, segmentsToPath }
