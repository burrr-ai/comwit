import { createElement, createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, fireEvent, render, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BellIcon, CheckIcon } from '../src/index'
import { AnimatedBellIcon, AnimatedCheckIcon } from '../src/animated'
import { Icon } from '../src/icon'
import { iconCatalog } from '../src/catalog'

let reduced: boolean
let listeners: Set<() => void>
let cancels: ReturnType<typeof vi.fn>[]
let animate: ReturnType<typeof vi.fn>

beforeEach(() => {
  reduced = false
  listeners = new Set()
  cancels = []
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reduced
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }))
  animate = vi.fn(() => {
    const cancel = vi.fn()
    cancels.push(cancel)
    return { cancel }
  })
  Object.defineProperty(SVGElement.prototype, 'animate', { configurable: true, value: animate })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('static SVG contract', () => {
  it('renders decorative icons by default and accessible names on request', () => {
    expect(renderToStaticMarkup(<CheckIcon size={18} />)).toContain('aria-hidden="true"')
    const markup = renderToStaticMarkup(<BellIcon title="Notifications" size={32} color="red" />)
    expect(markup).toContain('role="img"')
    expect(markup).toContain('aria-label="Notifications"')
    expect(markup).not.toContain('aria-hidden')
    expect(markup).toContain('width="32"')
    expect(markup).toContain('<title>Notifications</title>')
  })
  it('preserves caller SVG accessibility and styling attributes', () => {
    const { container } = render(
      <CheckIcon aria-label="Saved" className="status" strokeWidth={2} />
    )
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBeNull()
    expect(svg.getAttribute('stroke-width')).toBe('2')
    expect(svg.classList.contains('status')).toBe(true)
  })
  it('renders all catalog geometry and resolves every motion target to exactly one part', () => {
    expect(iconCatalog.length).toBe(60)
    expect(new Set(iconCatalog.map((icon) => icon.name)).size).toBe(iconCatalog.length)
    for (const definition of iconCatalog) {
      const { container, unmount } = render(createElement(Icon, { definition }))
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 24 24')
      expect(
        container.querySelectorAll('path, circle, rect, line, polyline, ellipse').length
      ).toBeGreaterThan(0)
      for (const track of definition.motion) {
        expect(
          container.querySelectorAll(`[data-icon-part="${track.part}"]`).length,
          definition.name
        ).toBe(1)
        expect(track.keyframes.length).toBeGreaterThan(1)
      }
      unmount()
    }
  })
})

describe('purposeful motion', () => {
  it('plays from the containing button, including keyboard focus, without autoplay', () => {
    const { getByRole } = render(
      <button data-icon-trigger>
        <AnimatedBellIcon />
        Notify
      </button>
    )
    expect(animate).not.toHaveBeenCalled()
    fireEvent.pointerEnter(getByRole('button'))
    expect(animate).toHaveBeenCalled()
    animate.mockClear()
    fireEvent.focusIn(getByRole('button'))
    expect(animate).toHaveBeenCalled()
  })
  it('respects reduced motion at mount and when the preference changes', () => {
    reduced = true
    const { getByRole } = render(
      <button data-icon-trigger>
        <AnimatedBellIcon animateOn="mount" />
        Notify
      </button>
    )
    expect(animate).not.toHaveBeenCalled()
    cleanup()
    reduced = false
    render(
      <button data-icon-trigger>
        <AnimatedBellIcon />
        Notify
      </button>
    )
    fireEvent.pointerEnter(getByRole('button'))
    expect(cancels.length).toBeGreaterThan(0)
    reduced = true
    act(() => listeners.forEach((listener) => listener()))
    expect(cancels.every((cancel) => cancel.mock.calls.length > 0)).toBe(true)
  })
  it('replays feedback only when replayKey changes and cancels work on unmount', () => {
    const ref = createRef<SVGSVGElement>()
    const { rerender, unmount } = render(
      <AnimatedCheckIcon ref={ref} animateOn="none" replayKey={0} />
    )
    expect(ref.current?.tagName.toLowerCase()).toBe('svg')
    expect(animate).not.toHaveBeenCalled()
    rerender(<AnimatedCheckIcon ref={ref} animateOn="none" replayKey={1} />)
    expect(animate).toHaveBeenCalled()
    const count = animate.mock.calls.length
    rerender(<AnimatedCheckIcon ref={ref} animateOn="none" replayKey={1} />)
    expect(animate.mock.calls.length).toBe(count)
    unmount()
    expect(cancels.every((cancel) => cancel.mock.calls.length > 0)).toBe(true)
    expect(listeners.size).toBe(0)
  })
  it('click mode plays only on click; unsupported browsers keep the drawing', () => {
    const { getByRole, container } = render(
      <button data-icon-trigger>
        <AnimatedBellIcon animateOn="click" />
        Notify
      </button>
    )
    fireEvent.pointerEnter(getByRole('button'))
    expect(animate).not.toHaveBeenCalled()
    fireEvent.click(getByRole('button'))
    expect(animate).toHaveBeenCalled()
    Object.defineProperty(SVGElement.prototype, 'animate', { configurable: true, value: undefined })
    expect(() => fireEvent.click(getByRole('button'))).not.toThrow()
    expect(container.querySelectorAll('svg path').length).toBeGreaterThan(0)
  })
})
