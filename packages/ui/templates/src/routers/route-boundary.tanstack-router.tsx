'use client'

/**
 * RouteBoundary — TanStack Router 용. `comwit-ui add page-transition` 이 @tanstack/react-router 를 감지하면 이 파일을 설치한다.
 *
 * 구현은 ssgoi 공식 어댑터(`@ssgoi/react/tanstack-router` 의 SsgoiRouteBoundary)다 — useRouterState 로 현재
 * pathname 을 읽는다. 여기서는 <PageBoundary> 와 같은 기본 클래스(min-h-full grow)만 입힌다.
 * 라우팅되는 영역(<Outlet /> 등)을 한 번 감싼다:
 *
 *   <PageTransition config={transitions}>
 *     <RouteBoundary><Outlet /></RouteBoundary>
 *   </PageTransition>
 */

import * as React from 'react'
import { SsgoiRouteBoundary, type SsgoiRouteBoundaryProps } from '@ssgoi/react/tanstack-router'

import { cn } from '../lib/utils'

export type RouteLocation = { pathname: string }

/** resolve · routeKey · as + 요소 속성. */
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

export { RouteBoundary }
