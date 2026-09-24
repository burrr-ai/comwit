'use client'

/**
 * comwit-ui — textarea 프리미티브 (네이티브 <textarea> 래퍼 · 스타일 0 · 앱 비의존).
 *
 * 멀티라인 입력의 **IME(한글 조합) 상태**를 프리미티브가 소유한다.
 * (radix 엔 textarea 가 없어 자체 구현 — button/input 과 같은 결.)
 *
 *  - composition(조합) 상태를 추적해 `data-composing` 으로 방출한다.
 *    소비처/CSS 는 이걸로 "조합 중" 을 감지하고, 엔터-제출 같은 키 핸들러를
 *    `e.nativeEvent.isComposing` / `data-composing` 로 가드할 수 있다.
 *  - 소비자가 넘긴 onCompositionStart/End 는 **덮어쓰지 않고 합성**한다.
 *  - autosize 는 CSS(`field-sizing: content`)의 몫 — 프리미티브는 높이에 관여하지 않는다.
 *  - `asChild` 로 다른 요소에 동작만 위임 가능(Slot). React 19 → `ref` 는 prop 으로 그대로 전달.
 *
 * 스타일(색/크기/보더)은 넣지 않는다. 소비 레이어(lib/components/ui)가 토큰으로 입힌다.
 * data-* (소비 CSS 훅): data-composing.
 */

import * as React from 'react'
import { Slot } from './slot'

type TextareaProps = React.ComponentProps<'textarea'> & {
  /** 자식 요소에 textarea 동작만 위임(스타일/구조는 자식이 소유). */
  asChild?: boolean
}

function Textarea({ asChild, onCompositionStart, onCompositionEnd, ...props }: TextareaProps) {
  const [isComposing, setComposing] = React.useState(false)

  const handleCompositionStart: React.CompositionEventHandler<HTMLTextAreaElement> = (e) => {
    setComposing(true)
    onCompositionStart?.(e)
  }
  const handleCompositionEnd: React.CompositionEventHandler<HTMLTextAreaElement> = (e) => {
    setComposing(false)
    onCompositionEnd?.(e)
  }

  const Comp = asChild ? Slot : 'textarea'

  return (
    <Comp
      data-slot="textarea"
      {...props}
      data-composing={isComposing ? 'true' : undefined}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  )
}

export { Textarea }
export type { TextareaProps }
