'use client'

/**
 * RouteBoundary — TanStack Router integration, installed when comwit-ui add page-transition detects @tanstack/react-router.
 *
 * Uses the official ssgoi adapter, SsgoiRouteBoundary from @ssgoi/react/tanstack-router, which reads pathname
 * through useRouterState. This layer adds only the PageBoundary defaults, min-h-full grow.
 * Wrap the routed area (such as Outlet) once:
 *
 *   <PageTransition config={transitions}>
 *     <RouteBoundary><Outlet /></RouteBoundary>
 *   </PageTransition>
 *
 * See https://ssgoi.dev/llms.txt for the adapter and boundary contract.
 */

import * as React from 'react'
import { SsgoiRouteBoundary, type SsgoiRouteBoundaryProps } from '@ssgoi/react/tanstack-router'

import { cn } from '../lib/utils'

export type RouteLocation = { pathname: string }

/** resolve, routeKey, as, and element attributes. */
export type RouteBoundaryProps<T extends React.ElementType = 'div'> = SsgoiRouteBoundaryProps<T>

function RouteBoundary<T extends React.ElementType = 'div'>(props: RouteBoundaryProps<T>) {
  const { className, ...rest } = props as { className?: string }
  return (
    <SsgoiRouteBoundary<T>
      {...(rest as RouteBoundaryProps<T>)}
      data-slot="page-boundary"
      // grow fills the flex-column shell in normal flow; min-h-full preserves shell height while exiting absolutely.
      className={cn('min-h-full grow', className)}
    />
  )
}

export { RouteBoundary }
