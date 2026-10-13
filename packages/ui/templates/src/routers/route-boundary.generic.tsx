'use client'

/**
 * RouteBoundary — default implementation installed when no router is detected.
 *
 * Pass the router's current pathname as path, synchronized with render; do not read window.location only
 * at mount time. Edit this file to read directly from a router hook:
 *
 *   function RouteBoundary(props) {
 *     const { pathname } = useMyRouter()
 *     return <PageBoundary path={pathname} {...props} />
 *   }
 *
 * For supported routers (next, react-router, @tanstack/react-router), reinstall the complete integration with
 * comwit-ui add page-transition --router <name>.
 */

import * as React from 'react'

import { PageBoundary, type PageBoundaryProps } from '../components/ui/page-transition'

export type RouteBoundaryProps<T extends React.ElementType = 'div'> = PageBoundaryProps<T>

function RouteBoundary<T extends React.ElementType = 'div'>(props: RouteBoundaryProps<T>) {
  return <PageBoundary<T> {...props} />
}

export { RouteBoundary }
