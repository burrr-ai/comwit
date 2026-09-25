'use client'

/**
 * 오버레이 모션 — 드롭다운 · 팝오버 · 셀렉트 · 다이얼로그 · 시트 · 바텀시트가 들어오고 나가는 움직임.
 *
 * 엔진은 @comwit/ui 의 usePresenceAnimation 이다: 진행도 t(0 = 닫힘, 1 = 열림)를 스프링으로 풀어 브라우저 내장
 * Web Animations API 로 재생한다. 첫 열림부터 돌고, 닫힘이 요청되면 파트는 스프링이 멎을 때까지 남으며, 도중에
 * 뒤집히면 지금 자리와 속도를 이어받아 되돌아간다. 여기엔 값만 있다 — t 에서의 모습(style)과 스프링.
 * 파트의 asChild 자식으로 둔다 — 파트의 ref · data-* · 핸들러 · className 이 이 요소에 그대로 붙는다.
 *
 *   <PopoverPrimitive.Content asChild className="…">
 *     <OverlayMotion preset="menu">{children}</OverlayMotion>
 *   </PopoverPrimitive.Content>
 *
 *  - menu    드롭다운 · 팝오버 · 셀렉트. 트리거 쪽(transform-origin)에서 0.6 배로 커지며 나타나고, 나온 방향(data-side)
 *            반대쪽에서 0.5rem 밀려온다. 살짝 튕긴다. 닫힐 땐 같은 길로 돌아간다.
 *  - dialog  가운데 다이얼로그. 0.9 배에서 커지며 나타난다.
 *  - sheet   붙은 변(side) 쪽으로 자기 크기만큼(100%) 들어오고 나간다. 튕기지 않는다 — 변에서 뜨면 안 된다.
 *  - scrim   오버레이 스크림. 투명도만.
 *
 * 스프링은 { duration(체감 초), bounce(0 = 넘치지 않음) } 이다. 값을 바꾸려면 아래 PRESETS 만 고친다.
 * 움직임은 transform · opacity 에만 건다 — 파트 자신의 위치는 translate 같은 개별 속성으로 두면 겹치지 않는다.
 * translate3d 로 두는 이유: 유리 면(backdrop-filter)이 움직이는 동안 WebKit 이 배경을 잃지 않게 합성 레이어를 고정한다.
 */

import * as React from 'react'
import { usePresenceAnimation, type PresenceAnimationOptions } from '@comwit/ui'

export type OverlayMotionPreset = 'menu' | 'dialog' | 'sheet' | 'scrim'
export type OverlayMotionSide = 'top' | 'right' | 'bottom' | 'left'

const clamp = (t: number) => Math.min(1, Math.max(0, t))
/** 투명도는 움직임보다 먼저 차오른다 — 커지는 동안 반투명 유령처럼 보이지 않게. */
const fadeIn = (t: number) => clamp(t * 1.5)

/** menu 가 나온 방향 반대쪽에서 밀려오는 거리(rem) — [x, y]. */
const MENU_FROM: Record<OverlayMotionSide, [number, number]> = {
  bottom: [0, -0.5],
  top: [0, 0.5],
  left: [0.5, 0],
  right: [-0.5, 0],
}

/** sheet 가 숨는 쪽 — 자기 크기(%)의 부호. [x, y]. */
const SHEET_FROM: Record<OverlayMotionSide, [number, number]> = {
  bottom: [0, 100],
  top: [0, -100],
  left: [-100, 0],
  right: [100, 0],
}

type Preset = Omit<PresenceAnimationOptions, 'onExitComplete'>

const PRESETS: Record<OverlayMotionPreset, (side: OverlayMotionSide | undefined) => Preset> = {
  menu: (side) => {
    const [x, y] = side ? MENU_FROM[side] : [0, 0]
    return {
      style: (t) => ({
        opacity: fadeIn(t),
        transform: `translate3d(${x * (1 - t)}rem, ${y * (1 - t)}rem, 0) scale(${0.6 + 0.4 * t})`,
      }),
      enter: { duration: 0.35, bounce: 0.12 },
      exit: { duration: 0.22 },
    }
  },
  dialog: () => ({
    style: (t) => ({
      opacity: fadeIn(t),
      transform: `translate3d(0, 0, 0) scale(${0.9 + 0.1 * t})`,
    }),
    enter: { duration: 0.35, bounce: 0.08 },
    exit: { duration: 0.2 },
  }),
  sheet: (side = 'bottom') => {
    const [x, y] = SHEET_FROM[side]
    return {
      style: (t) => {
        const hidden = 1 - clamp(t)
        return { transform: `translate3d(${x * hidden}%, ${y * hidden}%, 0)` }
      },
      enter: { duration: 0.45 },
      exit: { duration: 0.26 },
    }
  },
  scrim: () => ({
    style: (t) => ({ opacity: clamp(t) }),
    enter: { duration: 0.4 },
    exit: { duration: 0.26 },
  }),
}

type OverlayMotionProps = React.ComponentPropsWithoutRef<'div'> & {
  preset: OverlayMotionPreset
  /** sheet 는 붙은 변, menu 는 나온 방향. 생략하면 파트가 단 data-side 를 읽는다. */
  side?: OverlayMotionSide
  /** 닫힘 애니메이션이 끝나 파트가 사라지기 직전. */
  onExitComplete?: () => void
}

const OverlayMotion = React.forwardRef<HTMLDivElement, OverlayMotionProps>(function OverlayMotion(
  { preset, side, onExitComplete, style, ...props },
  forwardedRef
) {
  const placed = side ?? ((props as Record<string, unknown>)['data-side'] as OverlayMotionSide)
  const animate = usePresenceAnimation<HTMLDivElement>({
    ...PRESETS[preset](placed),
    onExitComplete,
  })
  // 파트가 넘긴 ref(포커스 · 바깥 클릭 · Presence)와 애니메이션 ref 를 한 요소에. 콜백은 늘 같다.
  const forwarded = React.useRef(forwardedRef)
  forwarded.current = forwardedRef
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      animate(node)
      const target = forwarded.current
      if (typeof target === 'function') target(node)
      else if (target) target.current = node
    },
    [animate]
  )

  return <div ref={ref} {...props} style={{ backfaceVisibility: 'hidden', ...style }} />
})

export { OverlayMotion }
