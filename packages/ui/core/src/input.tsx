'use client'

/**
 * comwit-ui — input 프리미티브 (bare · MUI InputBase 대응, 스타일 0 · 앱 비의존).
 *
 * 순수 네이티브 <input> 을 감싸 **동작/상태만** 소유하는 최소 프리미티브.
 * (색·크기·보더 등 토큰 스타일은 소비 레이어 lib/components/ui 가 cva 로 입힌다.)
 *
 *  - **IME 안전(한글 조합)**: composition 진행 여부를 `data-composing` 으로 방출한다.
 *    조합 중(compositionstart~end)엔 onChange 가 확정 전 중간 자모까지 흘려보내므로,
 *    소비자는 `data-composing` 을 훅으로 삼아 값 변환/검증/포맷을 조합 종료까지 **유예**할 수 있다.
 *    (예: onChange 에서 `e.currentTarget.dataset.composing` 확인, 또는 CSS 로 조합 중 상태 표시.)
 *    소비자가 넘긴 onCompositionStart/End 는 그대로 **체이닝**해 호출한다(삼키지 않는다).
 *  - **asChild**: Slot 으로 자식 요소에 동작/속성을 머지(text-field 의 Control 이 이 Input 을 감싸는 등).
 *  - **ref**: React 19 규약대로 ref 를 prop 으로 받아 네이티브 input(또는 Slot 자식)에 그대로 전달.
 *
 * 방출하는 data-*(소비 CSS/JS 훅): data-composing (조합 중일 때만 "true").
 */

import * as React from 'react'
import { Slot } from './slot'

type InputProps = React.ComponentProps<'input'> & {
  /** 자식 요소를 렌더 대상으로 삼아 동작/속성을 머지(Slot). */
  asChild?: boolean
}

function Input({ asChild = false, onCompositionStart, onCompositionEnd, ...props }: InputProps) {
  // "조합 중" 상태 — 오토필/제어값과 무관하게 이벤트로만 판정(ref 접근 없음 → react-hooks/refs 안전).
  const [isComposing, setComposing] = React.useState(false)

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    setComposing(true)
    onCompositionStart?.(e)
  }
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setComposing(false)
    onCompositionEnd?.(e)
  }

  const Comp = asChild ? Slot : 'input'

  return (
    <Comp
      data-slot="input"
      data-composing={isComposing ? 'true' : undefined}
      {...props}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  )
}

export { Input }
export type { InputProps }
