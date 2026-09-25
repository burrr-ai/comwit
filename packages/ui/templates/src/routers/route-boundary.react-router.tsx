'use client'

/**
 * RouteBoundary — React Router 용. `comwit-ui add page-transition` 이 react-router 를 감지하면 이 파일을 설치한다.
 *
 * useLocation 의 pathname 을 <PageBoundary> 에 넘긴다. 라우팅되는 영역(<Outlet /> 등)을 한 번 감싼다:
 *
 *   <PageTransition config={transitions}>
 *     <RouteBoundary><Outlet /></RouteBoundary>
 *   </PageTransition>
 */

import * as React from 'react'
import { useLocation, type Location } from 'react-router'

import { PageBoundary, type PageBoundaryProps } from '../components/ui/page-transition'

export type RouteBoundaryProps<T extends React.ElementType = 'div'> = Omit<
  PageBoundaryProps<T>,
  'path' | 'resolve'
> & {
  /** 논리 경로와 DOM 수명을 함께 정한다. 생략하면 { id: location.pathname }. */
  resolve?: (location: Location) => { id: string; key?: string | number }
}

function RouteBoundary<T extends React.ElementType = 'div'>({
  resolve,
  routeKey,
  ...props
}: RouteBoundaryProps<T>) {
  const location = useLocation()
  const boundary = resolve?.(location) ?? { id: location.pathname }
  return (
    <PageBoundary<T>
      {...(props as PageBoundaryProps<T>)}
      path={boundary.id}
      routeKey={routeKey ?? boundary.key}
    />
  )
}

export { RouteBoundary }
