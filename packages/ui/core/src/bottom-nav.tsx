'use client'

/**
 * comwit-ui — bottom-nav 프리미티브 (헤드리스 · 스타일 0).
 *
 * 하단 탭바의 동작: 선택 값(제어/비제어) · `aria-current` · 스크롤 의도에 따른 compact 상태 ·
 * 누르거나 포커스가 들어오면 즉시 펼치기. useIndicator 는 선택 위치·탄성·드래그를 추적한다.
 * 캡슐·렌즈의 SVG/CSS 표면은 소비 레이어가 입힌다.
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

/**
 * @license MIT
 * Directional elasticity adapted from rdev/liquid-glass-react (MIT):
 * https://github.com/rdev/liquid-glass-react/blob/master/src/index.tsx
 * Copyright 2025 MAX ROVENSKY
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function useIndicator() {
  const barRef = React.useRef<HTMLDivElement>(null)
  const lensRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const bar = barRef.current
    const lens = lensRef.current
    if (!bar || !lens) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let lastTime = 0
    let x = 0
    let velocity = 0
    let target = 0
    let width = 0
    let pressure = 0
    let initialized = false
    let suppressClick = false
    let gesture: { id: number; startX: number; startY: number; dragged: boolean } | null = null
    const tabs = () =>
      Array.from(bar.querySelectorAll<HTMLElement>('[data-slot="bottom-nav-item"]'))
    const enabled = (tab: HTMLElement) => !tab.matches(':disabled, [aria-disabled="true"]')
    const active = () => tabs().find((tab) => tab.dataset.state === 'active')
    const localX = (clientX: number) => {
      const rect = bar.getBoundingClientRect()
      return ((clientX - rect.left) / rect.width) * bar.offsetWidth
    }
    const draw = () => {
      // Upstream directional stretch/compression, driven by spring speed instead of mouse distance.
      const stretch = media.matches ? 0 : Math.min(Math.abs(velocity) / 1400, 1)
      const swell = media.matches ? 0 : pressure * 0.075
      lens.style.transform = `translate3d(${x}px, 0, 0) scale(${1 + stretch * 0.3 + swell}, ${1 - stretch * 0.15 + swell})`
      lens.style.setProperty('--liquid-pressure', String(pressure))
    }
    const tick = (time: number) => {
      const dt = Math.min((time - (lastTime || time - 16)) / 1000, 0.032)
      lastTime = time
      // Substeps keep the same spring stable at both 60 Hz and 120 Hz.
      for (let i = 0; i < 4; i++) {
        velocity += ((target - x) * 420 - velocity * 30) * (dt / 4)
        x += velocity * (dt / 4)
      }
      pressure += ((gesture ? 1 : 0) - pressure) * Math.min(1, dt * 22)
      const settled =
        Math.abs(target - x) < 0.02 &&
        Math.abs(velocity) < 0.1 &&
        Math.abs((gesture ? 1 : 0) - pressure) < 0.001
      if (settled || media.matches) {
        x = target
        velocity = 0
        pressure = gesture && !media.matches ? 1 : 0
        frame = 0
        lastTime = 0
      } else {
        frame = requestAnimationFrame(tick)
      }
      draw()
    }
    const animate = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      const tab = active()
      lens.style.visibility = tab ? 'visible' : 'hidden'
      if (!tab) {
        initialized = false
        return
      }
      width = tab.offsetWidth
      lens.style.width = `${width}px`
      if (!gesture) target = tab.offsetLeft
      if (!initialized || media.matches) {
        x = target
        velocity = 0
        initialized = true
        draw()
      }
      animate()
    }
    const down = (event: PointerEvent) => {
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        event.defaultPrevented ||
        gesture ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const tab = (event.target as Element).closest<HTMLElement>('[data-slot="bottom-nav-item"]')
      if (!tab || !enabled(tab) || !active()) return
      suppressClick = false
      gesture = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragged: false,
      }
      target = tab.offsetLeft
      bar.dataset.liquidPressed = ''
      animate()
    }
    const move = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.id) return
      if (
        !gesture.dragged &&
        Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 6
      ) {
        gesture.dragged = true
        bar.setPointerCapture(event.pointerId)
      }
      if (!gesture.dragged) return
      const positions = tabs().map((tab) => tab.offsetLeft)
      const min = Math.min(...positions)
      const max = Math.max(...positions)
      const next = localX(event.clientX) - width / 2
      // Rubber band at either end; the bubble never escapes the capsule.
      target =
        Math.max(min, Math.min(max, next)) +
        Math.max(-8, Math.min(8, (next < min ? next - min : next > max ? next - max : 0) * 0.12))
      lens.style.setProperty(
        '--liquid-light-x',
        `${Math.max(0, Math.min(100, ((localX(event.clientX) - x) / width) * 100))}%`
      )
      animate()
    }
    const finish = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.id) return
      const dragged = gesture.dragged
      gesture = null
      delete bar.dataset.liquidPressed
      if (bar.hasPointerCapture(event.pointerId)) bar.releasePointerCapture(event.pointerId)
      if (dragged) {
        suppressClick = true
        const rect = bar.getBoundingClientRect()
        if (
          event.type === 'pointerup' &&
          event.clientY >= rect.top - 24 &&
          event.clientY <= rect.bottom + 24 &&
          event.clientX >= rect.left - 24 &&
          event.clientX <= rect.right + 24
        ) {
          const px = localX(event.clientX)
          const tab = tabs().find(
            (item) => px >= item.offsetLeft && px <= item.offsetLeft + item.offsetWidth
          )
          // A real click preserves router links, preventDefault and consumer callbacks.
          if (tab && enabled(tab)) {
            tab.focus({ preventScroll: true })
            tab.click()
          }
        }
      }
      sync()
    }
    const click = (event: MouseEvent) => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault()
        event.stopPropagation()
        suppressClick = false
      }
    }
    const preventDrag = (event: DragEvent) => event.preventDefault()
    const observer = new MutationObserver(sync)
    observer.observe(bar, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-state', 'dir'],
    })
    const resize = new ResizeObserver(sync)
    resize.observe(bar)
    media.addEventListener('change', sync)
    bar.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    bar.addEventListener('lostpointercapture', finish)
    bar.addEventListener('click', click, true)
    bar.addEventListener('dragstart', preventDrag)
    sync()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      resize.disconnect()
      media.removeEventListener('change', sync)
      bar.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      bar.removeEventListener('lostpointercapture', finish)
      bar.removeEventListener('click', click, true)
      bar.removeEventListener('dragstart', preventDrag)
    }
  }, [])
  return { barRef, lensRef }
}

/* ---------------------------------------------------------------------------------------------- */

const Root = BottomNavRoot
const Item = BottomNavItem

export { BottomNavRoot, BottomNavItem, Root, Item, useIndicator }
export type { BottomNavRootProps, BottomNavItemProps }
