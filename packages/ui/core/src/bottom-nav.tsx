'use client'

/**
 * Headless bottom navigation: controlled/uncontrolled selection, aria-current, scroll-driven compact state, and immediate expansion on press or focus. Consumers own capsule styling and indicator springs. Compose Root with Item; Item supports asChild links. Root exposes data-state="expanded | compact" and Item exposes data-state="active | inactive".
 */

import * as React from 'react'

import { composeEventHandlers } from './internal/compose-event-handlers'
import { createContext } from './internal/context'
import { Primitive } from './internal/primitive'
import { useControllableState } from './internal/use-controllable-state'
import { useScrollChrome } from './scroll-chrome'

const ROOT_NAME = 'BottomNav'

type BottomNavContextValue = {
  value: string
  onValueChange: (value: string) => void
  compact: boolean
}
const [BottomNavProvider, useBottomNavContext] = createContext<BottomNavContextValue>(ROOT_NAME)

type PrimitiveNavProps = React.ComponentPropsWithoutRef<typeof Primitive.nav>

interface BottomNavRootProps extends Omit<PrimitiveNavProps, 'defaultValue'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Override scroll intent to control compact state directly. */
  compact?: boolean
}

const BottomNavRoot = React.forwardRef<HTMLElement, BottomNavRootProps>((props, forwardedRef) => {
  const { value: valueProp, defaultValue, onValueChange, compact: compactProp, ...navProps } = props
  const chrome = useScrollChrome()
  const compact = compactProp ?? chrome.compact
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? '',
    onChange: onValueChange,
    caller: ROOT_NAME,
  })
  const expand = () => {
    if (compact) chrome.expand()
  }

  return (
    <BottomNavProvider value={value} onValueChange={setValue} compact={compact}>
      <Primitive.nav
        data-state={compact ? 'compact' : 'expanded'}
        {...navProps}
        ref={forwardedRef}
        onPointerDownCapture={composeEventHandlers(props.onPointerDownCapture, expand)}
        onFocusCapture={composeEventHandlers(props.onFocusCapture, expand)}
      />
    </BottomNavProvider>
  )
})
BottomNavRoot.displayName = ROOT_NAME

const ITEM_NAME = 'BottomNavItem'

type PrimitiveButtonProps = React.ComponentPropsWithoutRef<typeof Primitive.button>

interface BottomNavItemProps extends Omit<PrimitiveButtonProps, 'value'> {
  value: string
}

const BottomNavItem = React.forwardRef<HTMLButtonElement, BottomNavItemProps>(
  (props, forwardedRef) => {
    const { value, ...itemProps } = props
    const context = useBottomNavContext(ITEM_NAME)
    const active = context.value === value
    return (
      <Primitive.button
        type="button"
        aria-current={active ? 'page' : undefined}
        data-state={active ? 'active' : 'inactive'}
        {...itemProps}
        ref={forwardedRef}
        onClick={composeEventHandlers(props.onClick, () => context.onValueChange(value))}
      />
    )
  }
)
BottomNavItem.displayName = ITEM_NAME

/* ---------------------------------------------------------------------------------------------- */

const Root = BottomNavRoot
const Item = BottomNavItem

export { BottomNavRoot, BottomNavItem, Root, Item }
export type { BottomNavRootProps, BottomNavItemProps }
