import { createElement, createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, fireEvent, render, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BellIcon, CheckIcon } from '../src/index'
import { AnimatedBellIcon, AnimatedCheckIcon } from '../src/animated'
import { Icon } from '../src/icon'
import { iconCatalog } from '../src/catalog'
import { bake, simulate } from '../src/motion'
import type { IconMotion } from '../src/types'

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
    expect(iconCatalog.length).toBe(109)
    expect(new Set(iconCatalog.map((icon) => icon.name)).size).toBe(iconCatalog.length)
    for (const definition of iconCatalog) {
      const { container, unmount } = render(createElement(Icon, { definition }))
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 24 24')
      expect(
        container.querySelectorAll('path, circle, rect, line, polyline, ellipse').length
      ).toBeGreaterThan(0)
      expect(definition.motion.length, definition.name).toBeGreaterThan(0)
      const parts = definition.motion.map((track) => track.part)
      expect(new Set(parts).size, `${definition.name}: one track per part`).toBe(parts.length)
      for (const track of definition.motion) {
        expect(
          container.querySelectorAll(`[data-icon-part="${track.part}"]`).length,
          definition.name
        ).toBe(1)
        const { keyframes, duration, settle } = bake(track)
        expect(keyframes.length, definition.name).toBeGreaterThan(1)
        expect(keyframes[0]!.offset).toBe(0)
        expect(keyframes.at(-1)!.offset).toBe(1)
        expect(settle, definition.name).toBeLessThanOrEqual(800)
        expect(duration, definition.name).toBeLessThanOrEqual(1500)
        if (track.pose.draw !== undefined)
          expect(
            container.querySelector(`[data-icon-part="${track.part}"]`)?.getAttribute('pathLength'),
            `${definition.name}: written strokes need a normalised length`
          ).toBe('1')
      }
      unmount()
    }
  })
})

describe('spring choreography', () => {
  const nudge: IconMotion = {
    part: 'arrow',
    pose: { x: 3 },
    steps: [
      [0, 1],
      [120, 0],
    ],
    spring: { duration: 380, bounce: 0.4 },
  }
  it('carries velocity through rest, overshoots, and lands exactly at rest', () => {
    const samples = simulate(nudge)
    const progress = samples.map((sample) => sample.progress)
    expect(Math.max(...progress)).toBeGreaterThan(0.5)
    expect(Math.min(...progress)).toBeLessThan(-0.05)
    expect(samples.at(-1)!.progress).toBe(0)
    for (let index = 1; index < samples.length; index++)
      expect(samples[index]!.time).toBeGreaterThanOrEqual(samples[index - 1]!.time)
  })
  it('bakes transforms, clamped opacity and write-on strokes into frame keyframes', () => {
    const { keyframes } = bake(nudge)
    expect(keyframes[0]!.transform).toBe('translate(0px, 0px)')
    expect(keyframes.some((frame) => String(frame.transform).includes('-'))).toBe(true)
    const writing = bake({
      part: 'tick',
      pose: { draw: 1, opacity: -1 },
      steps: [
        [0, 1, 'jump'],
        [80, 0],
      ],
      spring: { duration: 300, bounce: 0 },
    }).keyframes
    expect(writing[0]).toMatchObject({
      strokeDashoffset: '1',
      strokeDasharray: '1 2',
      opacity: '0',
    })
    expect(writing.at(-1)).toMatchObject({ strokeDashoffset: '0', opacity: '1' })
  })
  it('cuts cleanly on a jump instead of smearing across a frame', () => {
    const { keyframes } = bake({
      part: 'plane',
      pose: { x: 9 },
      steps: [
        [0, 1],
        [150, -1, 'jump'],
        [150, 0],
      ],
      spring: { duration: 380, bounce: 0.3 },
    })
    const offsets = keyframes.map((frame) => frame.offset)
    expect(offsets.some((offset, index) => index > 0 && offset === offsets[index - 1])).toBe(true)
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
  it('lets a gesture in flight finish, but restarts once only its tail remains', () => {
    const running = { cancel: vi.fn(), playState: 'running', currentTime: 0 }
    animate.mockImplementation(() => running)
    const { getByRole } = render(
      <button data-icon-trigger>
        <AnimatedBellIcon />
        Notify
      </button>
    )
    fireEvent.pointerEnter(getByRole('button'))
    const count = animate.mock.calls.length
    fireEvent.pointerEnter(getByRole('button'))
    expect(animate.mock.calls.length).toBe(count)
    running.currentTime = 5000
    fireEvent.pointerEnter(getByRole('button'))
    expect(animate.mock.calls.length).toBe(count * 2)
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
