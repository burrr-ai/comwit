/**
 * @comwit/ui-templates — 인터랙션 상태 클래스(포커스·눌림·비활성·리플)의 단일 출처.
 *
 * `@comwit/ui`(헤드리스 엔진)는 Tailwind 를 모른다. 동작(포커스 이동·리플 위치·비활성 처리)은
 * 프리미티브가 갖고, **시각은 전부 여기서** 온다. 포커스 링 색을 한 번 바꾸면
 * 버튼·칩·스위치·인풋이 함께 바뀐다. 개별 컴포넌트가 직접 `focus-visible:ring-...` 을 적지 말 것.
 */

/** 면이 있는 인터랙티브 요소(버튼·칩·스위치·탭)의 키보드 포커스 링. */
export const focusRing =
  'outline-none focus-visible:ring-focus focus-visible:ring-ring focus-visible:ring-offset-focus focus-visible:ring-offset-background'

/** 입력 필드 포커스 — 오프셋 없이 보더를 브랜드색으로 올리고 옅은 링을 덧댄다. */
export const focusField =
  'outline-none focus-visible:border-ring focus-visible:ring-field focus-visible:ring-ring/20'

/** InputGroup 처럼 내부 인풋의 포커스를 컨테이너가 대신 표시할 때. */
export const focusWithinField =
  'focus-within:border-ring focus-within:ring-field focus-within:ring-ring/20'

/** 눌림·전환 공통 — 살짝 눌리는 스케일 + 색 전환. */
export const pressable =
  'transition-[background-color,border-color,color,box-shadow,transform] duration-fast active:scale-press'

/** 비활성 공통. 텍스트를 죽일 땐 `text-disabled-foreground` 를 함께. */
export const disabledStyle = 'disabled:pointer-events-none disabled:opacity-disabled'

/** `aria-invalid` 가 걸린 필드. */
export const invalidField = 'aria-invalid:border-destructive aria-invalid:ring-destructive/20'

/**
 * `useRipple` / `useCenterRipple`(@comwit/ui) 의 `itemClassName` 으로 넘기는 리플 도트의 시각.
 * 위치·타이밍은 헤드리스 훅이, 색·모양·애니메이션은 여기가 소유한다.
 * `animate-ripple` 키프레임은 `styles/globals.css` 의 `@theme` 에 있다.
 */
export const rippleItemClassName = 'animate-ripple rounded-full bg-current opacity-0'
