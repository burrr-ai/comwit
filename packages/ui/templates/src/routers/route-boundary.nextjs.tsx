'use client'

/**
 * RouteBoundary — Next.js App Router 용. `comwit-ui add page-transition` 이 next 를 감지하면 이 파일을 설치한다.
 *
 * usePathname 으로 논리 경로를, useSelectedLayoutSegments 로 이 레이아웃이 소유한 슬롯을 읽어
 * <PageBoundary> 에 넘긴다. URL 훅이 서스펜드할 수 있어(Cache Components) Suspense 로 감싼다.
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
import { usePathname, useSelectedLayoutSegments } from 'next/navigation'

import { PageBoundary, type PageBoundaryProps } from '../components/ui/page-transition'

export type RouteLocation = {
  pathname: string
  /** 이 경계를 그리는 레이아웃 아래의 세그먼트(라우트 그룹 포함). */
  selectedSegments: string[]
}

export type RouteBoundaryProps<T extends React.ElementType = 'div'> = Omit<
  PageBoundaryProps<T>,
  'path' | 'resolve' | 'parallelRoutesKey' | 'fallback'
> & {
  /** 논리 경로와 DOM 수명을 함께 정한다. 생략하면 { id: pathname }. */
  resolve?: (location: RouteLocation) => { id: string; key?: string | number }
  /** 읽을 병렬 슬롯 이름(@ 없이). 기본 children. */
  parallelRoutesKey?: string
  /** URL 데이터가 풀리는 동안 보여줄 것. 기본 null. */
  fallback?: React.ReactNode
}

function RouteBoundary<T extends React.ElementType = 'div'>({
  fallback = null,
  ...props
}: RouteBoundaryProps<T>) {
  return (
    <React.Suspense fallback={fallback}>
      <ResolvedBoundary<T> {...props} />
    </React.Suspense>
  )
}

function ResolvedBoundary<T extends React.ElementType = 'div'>({
  resolve,
  parallelRoutesKey,
  routeKey,
  ...props
}: Omit<RouteBoundaryProps<T>, 'fallback'>) {
  const pathname = usePathname()
  const selectedSegments = useSelectedLayoutSegments(parallelRoutesKey ?? 'children') ?? []
  // app/pages 혼합 프로젝트에서 라우터가 아직 준비 전이면 빈 경로를 등록하지 않는다.
  if (pathname == null) return null
  const boundary = resolve?.({ pathname, selectedSegments }) ?? { id: pathname }
  return (
    <PageBoundary<T>
      {...(props as PageBoundaryProps<T>)}
      path={boundary.id}
      routeKey={routeKey ?? boundary.key}
    />
  )
}

const INTERCEPTION_PREFIX = /^(?:\(\.\.\.\)|\(\.\.\)|\(\.\))+/

/**
 * 레이아웃의 선택된 세그먼트를 논리 경로로 만든다. 라우트 그룹 `(group)` 과 인터셉트 표식 `(.)` 은 걷는다.
 * 중첩 레이아웃이면 그 레이아웃의 절대 경로를 basePath 로 준다.
 */
function segmentsToPath(segments: readonly string[], basePath = '/') {
  const path = segments
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .map((segment) => segment.replace(INTERCEPTION_PREFIX, ''))
    .filter(Boolean)
    .join('/')
  return `${basePath.replace(/\/$/, '')}/${path}`.replace(/\/$/, '') || '/'
}

export { RouteBoundary, segmentsToPath }
