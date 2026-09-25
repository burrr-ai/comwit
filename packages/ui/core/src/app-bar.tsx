'use client'

/**
 * comwit-ui — app-bar 프리미티브 (헤드리스 · 스타일 0).
 *
 * 앱바가 스크롤에 어떻게 붙어 있을지를 정한다. 시각(면·유리·높이)은 소비 레이어가 입힌다.
 *
 *  behavior
 *   - flow    문서 흐름대로 스크롤되어 올라간다.
 *   - pinned  항상 상단에 붙는다.
 *   - reveal  아래로 스크롤하면 숨고, 조금만 올려도 다시 나온다 — 가장 가까운 <ScrollChromeProvider> 의 의도를 따른다.
 *
 *   <AppBar.Root behavior="reveal">…</AppBar.Root>
 *
 * data-behavior 와 data-state="visible | hidden" 으로 상태를 알린다(sticky/transform 은 소비 CSS 의 몫).
 * `collapsed` 로 스크롤 의도 대신 직접 정할 수 있다.
 */

import * as React from 'react'

import { Primitive } from './internal/primitive'
import { useScrollChrome } from './scroll-chrome'

const ROOT_NAME = 'AppBar'

type AppBarBehavior = 'flow' | 'pinned' | 'reveal'

type PrimitiveHeaderProps = React.ComponentPropsWithoutRef<typeof Primitive.header>

interface AppBarRootProps extends PrimitiveHeaderProps {
  behavior?: AppBarBehavior
  /** 스크롤 의도 대신 호출부가 숨김을 직접 정할 때. */
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
