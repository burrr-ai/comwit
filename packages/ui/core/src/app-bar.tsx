'use client'

/**
 * Headless app-bar primitive. behavior="flow" follows document flow, "pinned" stays at the top, and "reveal" follows the nearest ScrollChromeProvider to hide on downward scroll and reveal on upward intent. Consumers style data-behavior and data-state="visible | hidden", including sticky positioning and transforms. collapsed overrides scroll intent. Usage: <AppBar.Root behavior="reveal">...</AppBar.Root>.
 */

import * as React from 'react'

import { Primitive } from './internal/primitive'
import { useScrollChrome } from './scroll-chrome'

const ROOT_NAME = 'AppBar'

type AppBarBehavior = 'flow' | 'pinned' | 'reveal'

type PrimitiveHeaderProps = React.ComponentPropsWithoutRef<typeof Primitive.header>

interface AppBarRootProps extends PrimitiveHeaderProps {
  behavior?: AppBarBehavior
  /** Override scroll intent to control visibility directly. */
  collapsed?: boolean
}

const AppBarRoot = React.forwardRef<HTMLElement, AppBarRootProps>((props, forwardedRef) => {
  const { behavior = 'pinned', collapsed, ...rootProps } = props
  const { compact } = useScrollChrome()
  const hidden = collapsed ?? (behavior === 'reveal' && compact)
  return (
    <Primitive.header
      data-behavior={behavior}
      data-state={hidden ? 'hidden' : 'visible'}
      {...rootProps}
      ref={forwardedRef}
    />
  )
})
AppBarRoot.displayName = ROOT_NAME

/* ---------------------------------------------------------------------------------------------- */

const Root = AppBarRoot

export { AppBarRoot, Root }
export type { AppBarRootProps, AppBarBehavior }
