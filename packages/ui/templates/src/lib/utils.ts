import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * 토큰 유틸을 tailwind-merge 에 등록한다. 등록하지 않으면 조용히 깨진다:
 *  1) 모르는 이름을 색으로 오인 — `text-label text-foreground` 에서 크기가, `ring-focus ring-ring`
 *     에서 링 두께가 지워진다(= 전 컴포넌트의 키보드 포커스 링이 사라진다).
 *  2) 같은 그룹인 줄 몰라 둘 다 남는다 — `rounded-control` 을 호출부의 `rounded-lg` 가 못 덮는다.
 * styles/globals.css 의 @theme / @utility 에 이름을 추가하면 여기도 함께 갱신할 것.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'display-xl',
        'display-lg',
        'display-md',
        'display-sm',
        'title-lg',
        'title-md',
        'title-sm',
        'body',
        'body-sm',
        'label',
        'caption',
        'micro',
      ],
      radius: ['control', 'card', 'sheet', 'pill'],
      shadow: ['card', 'card-hover', 'message', 'panel', 'raised'],
      ease: ['standard', 'emphasized'],
    },
    classGroups: {
      'ring-w': [{ ring: ['focus', 'field'] }],
      'ring-offset-w': [{ 'ring-offset': ['focus'] }],
      opacity: [{ opacity: ['disabled', 'disabled-content'] }],
      duration: [{ duration: ['instant', 'fast', 'base', 'slow', 'slower'] }],
      z: [{ z: ['raised', 'sticky', 'appbar', 'overlay', 'modal', 'dropdown', 'toast'] }],
      scale: [{ scale: ['press', 'press-thumb'] }],
      'min-w': [{ 'min-w': ['menu'] }],
      w: [{ w: ['picker'] }],
      'max-w': [{ 'max-w': ['picker'] }],
      h: [{ h: ['appbar', 'bottom-nav'] }],
    },
  },
})

/** clsx + tailwind-merge — 조건부 클래스 결합 + 충돌 유틸리티 병합(토큰 유틸 인식). */
export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs))
}
