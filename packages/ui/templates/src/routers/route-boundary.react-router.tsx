'use client'

/**
 * RouteBoundary — React Router integration, installed when comwit-ui add page-transition detects react-router.
 *
 * Passes useLocation pathname to PageBoundary. Wrap the routed area (such as Outlet) once:
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
  /** Determine both logical path and DOM lifetime. Defaults to { id: location.pathname }. */
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
