'use client'

/**
 * RouteBoundary — TanStack Router 용. `comwit-ui add page-transition` 이 @tanstack/react-router 를 감지하면 이 파일을 설치한다.
 *
 * useRouterState 로 현재 pathname 을 읽어 <PageBoundary> 에 넘긴다. 라우팅되는 영역(<Outlet /> 등)을 한 번 감싼다:
 *
 *   <PageTransition config={transitions}>
 *     <RouteBoundary><Outlet /></RouteBoundary>
 *   </PageTransition>
 */

import * as React from 'react'
import { useRouterState } from '@tanstack/react-router'

import { PageBoundary, type PageBoundaryProps } from '../components/ui/page-transition'

export type RouteLocation = { pathname: string }

export type RouteBoundaryProps<T extends React.ElementType = 'div'> = Omit<
  PageBoundaryProps<T>,
  'path' | 'resolve'
> & {
  /** 논리 경로와 DOM 수명을 함께 정한다. 생략하면 { id: pathname }. */
  resolve?: (location: RouteLocation) => { id: string; key?: string | number }
}

function RouteBoundary<T extends React.ElementType = 'div'>({
  resolve,
  routeKey,
  ...props
}: RouteBoundaryProps<T>) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const boundary = resolve?.({ pathname }) ?? { id: pathname }
  return (
    <PageBoundary<T>
      {...(props as PageBoundaryProps<T>)}
      path={boundary.id}
      routeKey={routeKey ?? boundary.key}
    />
  )
}

export { RouteBoundary }
