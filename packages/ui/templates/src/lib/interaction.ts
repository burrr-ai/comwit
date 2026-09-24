/**
 * @comwit/ui-templates — 공통 인터랙션 클래스 상수 (Tailwind).
 * 모든 스타일 컴포넌트는 포커스/눌림/비활성/리플 상태를 여기서 import 해 통일한다.
 * (토큰만 바꾸면 전 컴포넌트의 인터랙션 색이 함께 바뀐다)
 *
 * `@comwit/ui`(헤드리스 엔진)는 Tailwind 등 어떤 스타일 프레임워크에도 의존하지 않으므로,
 * 이 상수들은 항상 여기(templates 레이어)에서만 소유한다.
 */

/** 키보드 포커스 링 — 버튼·칩·스위치 등 면이 있는 인터랙티브 요소. */
export const focusRing =
  'outline-none focus-visible:ring-focus focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background'

/** 입력 필드 포커스 — 오프셋 없이 보더 강조 + 옅은 링. */
export const focusField =
  'outline-none focus-visible:border-ring focus-visible:ring-focus focus-visible:ring-ring/20'

/** InputGroup 처럼 내부 포커스를 컨테이너가 받아 표시할 때. */
export const focusWithinField =
  'focus-within:border-ring focus-within:ring-focus focus-within:ring-ring/20'

/** 눌림·전환 공통 — 살짝 눌리는 스케일 + 색 전환. */
export const pressable =
  'transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-standard active:scale-press'

/** 비활성 공통. */
export const disabledStyle = 'disabled:pointer-events-none disabled:opacity-disabled'

/** aria-invalid 필드 공통. */
export const invalidField = 'aria-invalid:border-destructive aria-invalid:ring-destructive/20'

/**
 * `useRipple`/`useCenterRipple`(comwit-ui) 의 `itemClassName` 으로 넘기는 리플 도트의 시각.
 * 위치/타이밍은 헤드리스 훅이 소유하고, 색·모양·애니메이션은 여기서 정의한다.
 * `animate-ripple` 키프레임은 `styles/globals.css` 에 있다.
 */
export const rippleItemClassName = 'animate-ripple rounded-full bg-current opacity-0'
