'use client'

const ARRIVED = 'data-arrived'
const timers = new WeakMap<HTMLElement, number>()

/**
 * Briefly highlight the destination, including items already in place or constrained by the page bottom. ui.css styles [data-arrived].
 */
export function markArrived(target: HTMLElement) {
  window.clearTimeout(timers.get(target))
  target.removeAttribute(ARRIVED)
  void target.offsetWidth // Restart the animation when the same item is selected again.
  target.setAttribute(ARRIVED, '')
  timers.set(
    target,
    window.setTimeout(() => target.removeAttribute(ARRIVED), 1800)
  )
}

/**
 * Scroll directly to a gallery item or group without routing. scroll-margin-top aligns it below the header.
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
