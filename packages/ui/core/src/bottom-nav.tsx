'use client'

/**
 * comwit-ui — bottom-nav 프리미티브 (헤드리스 · 스타일 0).
 *
 * 하단 탭바의 동작: 선택 값(제어/비제어) · `aria-current` · 스크롤 의도에 따른 compact 상태 ·
 * 누르거나 포커스가 들어오면 즉시 펼치기. 캡슐·인디케이터 스프링 같은 시각은 소비 레이어가 입힌다.
 *
 *   <BottomNav.Root value={tab} onValueChange={setTab}>
 *     <BottomNav.Item value="home">…</BottomNav.Item>
 *     <BottomNav.Item value="feed" asChild><Link href="/feed">…</Link></BottomNav.Item>
 *   </BottomNav.Root>
 *
 * Root 는 data-state="expanded | compact", Item 은 data-state="active | inactive" 를 방출한다.
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
  /** 스크롤 의도 대신 호출부가 compact 를 직접 정할 때. */
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
