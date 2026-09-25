'use client'

const ARRIVED = 'data-arrived'
const timers = new WeakMap<HTMLElement, number>()

/**
 * 도착 표시 — 스크롤할 필요가 없던 항목(이미 제자리거나, 페이지 끝이라 더 못 올라가는 항목)도
 * 어디에 왔는지 보이게 잠깐 빛낸다. 모양은 ui.css 의 `[data-arrived]` 가 갖는다.
 */
export function markArrived(target: HTMLElement) {
  window.clearTimeout(timers.get(target))
  target.removeAttribute(ARRIVED)
  void target.offsetWidth // 같은 항목을 다시 골라도 애니메이션을 처음부터 돌린다
  target.setAttribute(ARRIVED, '')
  timers.set(
    target,
    window.setTimeout(() => target.removeAttribute(ARRIVED), 1800)
  )
}

/**
 * 갤러리 페이지 안에서 항목·그룹으로 간다. 라우터를 거치지 않고 바로 스크롤하며,
 * 대상은 헤더 바로 아래 맨 위로 올라온다(scroll-margin-top).
 */
export function goToGalleryTarget(id: string) {
  const target = document.getElementById(id)
  if (!target) return false
  if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  if (target.hasAttribute('data-gallery-item')) markArrived(target)
  return true
}
