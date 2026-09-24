'use client'

import * as React from 'react'

type RippleItem = { key: number; x: number; y: number; size: number }

let rippleId = 0

/** 리플 컨테이너 — 위치·오버플로만 담당(호스트의 border-radius 를 그대로 상속), 시각은 없음. */
const RIPPLE_CONTAINER_STYLE: React.CSSProperties = {
  pointerEvents: 'none',
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
  borderRadius: 'inherit',
}

/** 중앙 리플(useCenterRipple) 아이템 — 컨테이너를 그대로 채운다(좌표 계산 없음). */
const CENTER_ITEM_STYLE: React.CSSProperties = { position: 'absolute', inset: 0 }

/**
 * 눌린 지점에서 퍼지는 리플 (comwit-ui/utils 인터랙션 프리미티브).
 *
 * 헤드리스: 위치·크기·타이밍(cleanup)만 소유하고 **시각은 0** — 리플 도트가 실제로 보이려면
 * `itemClassName` 으로 색·모양·애니메이션(예: `animate-ripple rounded-full bg-current opacity-0`)을
 * 소비 레이어(템플릿)가 넘겨야 한다. 생략하면 위치만 계산되고 아무것도 렌더링되어 보이지 않는다.
 * 호스트 요소 요구사항: `position: relative; overflow: hidden`.
 *
 * @example
 * const { onRippleDown, ripples } = useRipple(disabled, 'animate-ripple rounded-full bg-current opacity-0')
 * <button onPointerDown={onRippleDown} style={{ position: 'relative', overflow: 'hidden' }}>
 *   {ripples}
 *   {children}
 * </button>
 */
export function useRipple(disabled?: boolean, itemClassName?: string) {
  const [items, setItems] = React.useState<RippleItem[]>([])

  const onRippleDown = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled) return
      const rect = e.currentTarget.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      setItems((prev) => [
        ...prev,
        {
          key: rippleId++,
          x: e.clientX - rect.left - size / 2,
          y: e.clientY - rect.top - size / 2,
          size,
        },
      ])
    },
    [disabled]
  )

  const remove = React.useCallback((key: number) => {
    setItems((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const ripples = (
    <span aria-hidden style={RIPPLE_CONTAINER_STYLE}>
      {items.map((r) => (
        <span
          key={r.key}
          onAnimationEnd={() => remove(r.key)}
          className={itemClassName}
          style={{ position: 'absolute', left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </span>
  )

  return { onRippleDown, ripples }
}

/**
 * 중앙에서 퍼지는 리플 — 체크박스·라디오처럼 작은 컨트롤의 헤일로 안에서 쓴다.
 * `ripples` 를 원형 헤일로 컨테이너 안에 렌더하면 컨테이너를 정확히 채우며 퍼진다.
 * 좌표 계산이 없어 어떤 크기의 컨테이너에도 맞는다. `itemClassName` 규칙은 {@link useRipple} 과 동일 —
 * 헤드리스이므로 시각(색·모양·애니메이션)은 항상 소비 레이어가 넘긴다.
 */
export function useCenterRipple(disabled?: boolean, itemClassName?: string) {
  const [items, setItems] = React.useState<number[]>([])

  const onRippleDown = React.useCallback(() => {
    if (disabled) return
    setItems((prev) => [...prev, rippleId++])
  }, [disabled])

  const remove = React.useCallback((key: number) => {
    setItems((prev) => prev.filter((k) => k !== key))
  }, [])

  const ripples = (
    <span aria-hidden style={RIPPLE_CONTAINER_STYLE}>
      {items.map((k) => (
        <span
          key={k}
          onAnimationEnd={() => remove(k)}
          className={itemClassName}
          style={CENTER_ITEM_STYLE}
        />
      ))}
    </span>
  )

  return { onRippleDown, ripples }
}
