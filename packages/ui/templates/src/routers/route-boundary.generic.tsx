'use client'

/**
 * RouteBoundary — 라우터를 감지하지 못했을 때 설치되는 기본 구현.
 *
 * 라우터의 현재 pathname 을 `path` 로 넘긴다(렌더와 같은 순간의 값이어야 한다 — mount 시점의
 * window.location 을 읽지 말 것). 라우터 훅으로 직접 읽고 싶으면 이 파일을 고치면 된다:
 *
 *   function RouteBoundary(props) {
 *     const { pathname } = useMyRouter()
 *     return <PageBoundary path={pathname} {...props} />
 *   }
 *
 * 지원 라우터(next · react-router · @tanstack/react-router)는 `comwit-ui add page-transition --router <name>` 으로
 * 완성된 구현을 다시 받을 수 있다.
 */

import * as React from 'react'

import { PageBoundary, type PageBoundaryProps } from '../components/ui/page-transition'

export type RouteBoundaryProps<T extends React.ElementType = 'div'> = PageBoundaryProps<T>

function RouteBoundary<T extends React.ElementType = 'div'>(props: RouteBoundaryProps<T>) {
  return <PageBoundary<T> {...props} />
}

export { RouteBoundary }
