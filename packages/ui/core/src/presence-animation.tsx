'use client'

/**
 * comwit-ui — usePresenceAnimation (헤드리스 · 라이브러리 0).
 *
 * 오버레이 파트(Dialog · Popover · DropdownMenu · Select · BottomSheet 의 Content/Overlay)가 들어오고 나가는 움직임을
 * 스프링으로 풀고 브라우저 내장 Web Animations API(`element.animate`)로 재생한다. 첫 열림부터 돌고, 닫힘이 요청되면
 * 파트는 닫힘 스프링이 멎을 때까지 남는다(Presence 가 기다린다). 공개하는 건 이 훅 하나다 — 적분기와 재생은 내부다.
 *
 *   const ref = usePresenceAnimation<HTMLDivElement>({
 *     // 진행도 t: 0 = 닫힘, 1 = 열림. 스프링이 t 를 움직이고, 매 프레임의 모습이 키프레임이 된다.
 *     style: (t) => ({ opacity: t, transform: `scale(${0.6 + 0.4 * t})` }),
 *     enter: { duration: 0.35, bounce: 0.1 },
 *     exit: { duration: 0.25 },
 *   })
 *   <Popover.Content asChild><div ref={ref}>…</div></Popover.Content>
 *
 *  - 진행도는 스프링 적분기로 60fps 프레임에 굽고, 그 프레임들을 키프레임으로 넘긴다 — 재생은 합성기가 한다.
 *  - 도중에 방향이 바뀌면 지금 재생 중인 프레임의 **위치와 속도**를 읽어 반대 목표로 다시 굽는다. 속도가 이어지므로
 *    닫히다 다시 열리는 움직임이 멈칫하지 않는다.
 *  - 시작 시각은 WAAPI 가 정한다 — 첫 프레임이 실제로 그려질 때 출발하고(pending play), transform · opacity 는
 *    합성기에서 돌아 그 뒤 메인 스레드가 바빠도(렌즈 맵 생성 등) 끊기지 않는다. 프레임 루프는 따로 없다.
 *  - 끝난 뒤에도 마지막 모습을 유지한다(fill: both) — 파트 자신의 위치는 translate 같은 개별 속성으로 둔다.
 *  - 시스템이 동작 줄이기면 열린 모습(style(1))에 머문 채 투명도만 짧게 바꾼다.
 *  - 모습 · 스프링 값은 소비처(템플릿)의 몫이다 — 여기엔 값이 없다.
 */

import * as React from 'react'

import { usePresenceExit } from './internal/presence'
import {
  sampleSpring,
  simulateSpring,
  type SpringConfig,
  type SpringFrame,
} from './internal/spring'
import { useLayoutEffect } from './internal/use-layout-effect'

interface PresenceAnimationOptions {
  /** 진행도 t(0 = 닫힘, 1 = 열림)에서의 모습. 튕기는 스프링이면 t 가 잠깐 1 을 넘는다. */
  style: (t: number) => Keyframe
  /** 열릴 때의 스프링. 기본 `{ duration: 0.35 }`. */
  enter?: SpringConfig
  /** 닫힐 때의 스프링. 기본 `{ duration: 0.25 }`. */
  exit?: SpringConfig
  /** 닫힘이 멎어 파트가 사라지기 직전에 불린다(overlay-kit 의 unmount 등). */
  onExitComplete?: () => void
}

const ENTER: SpringConfig = { duration: 0.35 }
const EXIT: SpringConfig = { duration: 0.25 }
/** 동작 줄이기 — 투명도만 이 시간(ms)에 선형으로. */
const REDUCED_MS = 120

type Run = { animation: Animation; frames: SpringFrame[] }

function prefersReducedMotion(node: Element) {
  const view = node.ownerDocument.defaultView
  return Boolean(view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/** 동작 줄이기 모습 — 열린 자리에 머문 채 투명도만. */
function fadeAt(style: PresenceAnimationOptions['style'], t: number): Keyframe {
  const rest = style(1)
  const opacity = typeof rest.opacity === 'number' ? rest.opacity : 1
  return { ...rest, opacity: opacity * Math.min(1, Math.max(0, t)) }
}

function usePresenceAnimation<T extends Element = HTMLElement>(
  options: PresenceAnimationOptions
): React.RefCallback<T> {
  const { present, onExitComplete } = usePresenceExit()
  const [node, setNode] = React.useState<T | null>(null)
  const optionsRef = React.useRef(options)
  optionsRef.current = options
  const exitRef = React.useRef(onExitComplete)
  exitRef.current = onExitComplete
  const runRef = React.useRef<Run | null>(null)

  // 레이아웃 단계에서 시작한다 — 첫 페인트 전에 닫힌 모습이 걸려 번쩍임이 없다.
  useLayoutEffect(() => {
    const finishExit = () => {
      optionsRef.current.onExitComplete?.()
      exitRef.current()
    }
    if (!node || typeof node.animate !== 'function') {
      if (node && !present) finishExit()
      return
    }
    const { style, enter = ENTER, exit = EXIT } = optionsRef.current
    const target = present ? 1 : 0

    // 지금 그려진 진행도와 속도 — 처음이면 닫힌 자리에서, 도중이면 거기서 이어받는다.
    const previous = runRef.current
    let from = { position: 0, velocity: 0 }
    if (previous) {
      from = sampleSpring(previous.frames, Number(previous.animation.currentTime ?? 0))
      previous.animation.cancel()
    }

    const reduced = prefersReducedMotion(node)
    const frames: SpringFrame[] = reduced
      ? [
          { time: 0, position: from.position, velocity: 0 },
          { time: REDUCED_MS, position: target, velocity: 0 },
        ]
      : simulateSpring(present ? enter : exit, from.position, target, from.velocity)
    const total = frames[frames.length - 1]!.time
    const keyframes = frames.map((frame) => ({
      ...(reduced ? fadeAt(style, frame.position) : style(frame.position)),
      offset: frame.time / total,
    }))
    const animation = node.animate(keyframes, { duration: total, easing: 'linear', fill: 'both' })
    runRef.current = { animation, frames }

    if (!present) {
      animation.finished.then(
        () => {
          if (runRef.current?.animation === animation) finishExit()
        },
        () => {} // 다시 열려서 취소됐다 — 새 재생이 이어받는다.
      )
    }
  }, [node, present])

  return setNode as React.RefCallback<T>
}

export { usePresenceAnimation }
export type { PresenceAnimationOptions, SpringConfig }
