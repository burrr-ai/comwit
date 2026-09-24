'use client'

/**
 * comwit-ui — button 프리미티브 (radix primitives 엔 범용 button 이 없어 자체 헤드리스 구현 · 스타일 0 · 앱 비의존).
 *
 * 네이티브 <button>(또는 asChild 로 임의 요소)에 **press/ripple 인터랙션 + disabled + type 기본값**만 얹는다.
 * 색·사이즈 등 토큰 스타일은 넣지 않는다(구조/모션만) — 시각은 소비 레이어(lib/components/ui)가 cva 로 입힌다.
 *
 *  - **ripple**: useRipple 을 프리미티브가 내부 배선한다. onPointerDown 에서 리플을 띄우고,
 *    리플을 담을 위치 기준(인라인 style: relative/overflow-hidden) + {ripples} 스팬을 프리미티브가 소유한다.
 *    리플 도트의 시각(색·모양·애니메이션)은 헤드리스라 여기 없음 — `rippleClassName` 으로 소비 레이어가 넘긴다.
 *    소비자가 넘긴 onPointerDown 은 **덮어쓰지 않고 체이닝**한다(리플 → 소비자 핸들러 순).
 *  - **asChild**: Slot 으로 자식 요소에 동작만 위임. 임의 호스트라 리플 구조를 보장할 수 없어 리플은 끈다.
 *    (disabled 도 넘기지 않는다 — <a> 등엔 무의미/무효.)
 *  - **disableRipple**: 리플이 부적절한 표현(예: link 형태)에서 소비 레이어가 리플만 끌 수 있다.
 *  - **type**: 폼 안에서 의도치 않은 submit 을 막기 위해 네이티브 기본을 'button' 으로 둔다(명시 type 은 그대로 우선).
 *  - **ref**: React 19 규약대로 ref 를 prop 으로 받아 {...props} 로 네이티브 button(또는 Slot 자식)에 전달.
 */

import * as React from 'react'
import { Slot } from './slot'
import { useRipple } from './utils/ripple'

/** 리플이 있을 때 호스트에 필요한 구조(위치 기준 + 오버플로 클립) — 시각이 아니라 인라인 스타일로 강제한다. */
const RIPPLE_HOST_STYLE: React.CSSProperties = { position: 'relative', overflow: 'hidden' }

type ButtonProps = React.ComponentProps<'button'> & {
  /** 자식 요소를 렌더 대상으로 삼아 동작만 위임(Slot). asChild 일 땐 리플/disabled 를 넘기지 않는다. */
  asChild?: boolean
  /** 리플 인터랙션 비활성(예: link 형태). asChild 일 땐 항상 비활성. */
  disableRipple?: boolean
  /** 리플 도트의 시각(색·모양·애니메이션) 클래스. 헤드리스라 기본값 없음 — 소비 레이어가 넘겨야 리플이 보인다. */
  rippleClassName?: string
}

function Button({
  asChild = false,
  disableRipple = false,
  rippleClassName,
  className,
  disabled,
  style,
  onPointerDown,
  children,
  ...props
}: ButtonProps) {
  // 리플 훅은 순서 보존을 위해 분기 전에 항상 호출(asChild 여도 무해하게 미사용).
  const { onRippleDown, ripples } = useRipple(disabled, rippleClassName)

  // asChild 는 임의 호스트라 리플 구조를 보장 못 하므로 끈다.
  const withRipple = !asChild && !disableRipple

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={className}
        style={style}
        {...props}
        onPointerDown={onPointerDown}
      >
        {children}
      </Slot>
    )
  }

  return (
    <button
      data-slot="button"
      type="button"
      className={className}
      style={withRipple ? { ...RIPPLE_HOST_STYLE, ...style } : style}
      disabled={disabled}
      {...props}
      onPointerDown={(e) => {
        if (withRipple) onRippleDown(e)
        onPointerDown?.(e)
      }}
    >
      {withRipple ? ripples : null}
      {children}
    </button>
  )
}

export { Button }
export type { ButtonProps }
