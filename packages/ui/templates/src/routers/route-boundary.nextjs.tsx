'use client'

/**
 * RouteBoundary — Next.js App Router integration, installed when comwit-ui add page-transition detects next.
 *
 * Uses the official ssgoi adapter, SsgoiRouteBoundary from @ssgoi/react/nextjs. It reads the logical path with
 * usePathname and the layout-owned slot with useSelectedLayoutSegments, wrapped in Suspense because URL
 * hooks may suspend with Cache Components. This layer adds only the PageBoundary defaults, min-h-full grow.
 *
 *   // app/layout.tsx: wrap the routed area once.
 *   <PageTransition config={transitions}>
 *     <RouteBoundary>{children}</RouteBoundary>
 *   </PageTransition>
 *
 *   // Persistent tab shell: fixed outer routeKey; inner boundary replaces the page, including its app bar.
 *   <RouteBoundary routeKey="tabs" className="flex min-h-full flex-col">
 *     <RouteBoundary className="flex-1">{children}</RouteBoundary>
 *     <BottomNav … />
 *   </RouteBoundary>
 *
 * Use resolve to choose id/key when the URL differs from the owned slot, such as intercepted @modal routes.
 * See https://ssgoi.dev/llms.txt for the adapter and boundary contract.
 */

import * as React from 'react'
import {
  SsgoiRouteBoundary,
  selectedSegmentsToPath,
  type NextjsRouteLocation,
  type SsgoiRouteBoundaryProps,
} from '@ssgoi/react/nextjs'

import { cn } from '../lib/utils'

/** pathname plus segments below the layout rendering this boundary, including route groups. */
export type RouteLocation = NextjsRouteLocation

/** resolve, routeKey, parallelRoutesKey, fallback, as, and element attributes. */
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

/**
 * Convert selected layout segments into a logical path, removing route groups (group) and interception
 * markers (.). For nested layouts, pass their absolute path as basePath. Uses ssgoi selectedSegmentsToPath.
 */
const segmentsToPath = selectedSegmentsToPath

export { RouteBoundary, segmentsToPath }
