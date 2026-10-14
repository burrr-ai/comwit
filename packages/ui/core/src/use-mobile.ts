'use client'

/**
 * comwit-ui — headless mobile-detection hook.
 * Used by components that choose presentation by viewport size, such as popover/bottom-sheet pickers and top/bottom-right toasts.
 */

import * as React from 'react'

interface UseMobileResult {
  isMobile: boolean
  /** False during SSR or before detection. Render a skeleton or default to the desktop presentation. */
  detected: boolean
}

/**
 * Viewport-width mobile detection using the (max-width: breakpoint px) media query.
 *
 * @param breakpoint Maximum width considered mobile; defaults to 768.
 */
function useMobile(breakpoint: number = 768): UseMobileResult {
  const [state, setState] = React.useState<UseMobileResult>({ isMobile: false, detected: false })

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setState({ isMobile: mediaQuery.matches, detected: true })
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [breakpoint])

  return state
}

/** User-agent mobile-device detection; checks the device type, not viewport size. */
function useMobileDevice(): UseMobileResult {
  const [state, setState] = React.useState<UseMobileResult>({ isMobile: false, detected: false })

  React.useEffect(() => {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as { opera?: string }).opera || ''
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase()
    )
    setState({ isMobile: isMobileDevice, detected: true })
  }, [])

  return state
}

export { useMobile, useMobileDevice }
export type { UseMobileResult }
