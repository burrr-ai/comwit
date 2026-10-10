// @vitest-environment happy-dom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root as ReactRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Root, Item, useIndicator } from '../src/bottom-nav'
import { createLensMap } from '../src/glass-lens'

let host: HTMLDivElement
let root: ReactRoot
let frames: Map<number, FrameRequestCallback>
let now: number
let nextFrame: number
let reduced = false
let captured = false

function Fixture({ onChange = (_: string) => {}, rtl = false }) {
  const { barRef, lensRef } = useIndicator()
  return (
    <Root defaultValue="home" onValueChange={onChange}>
      <div ref={barRef} data-test-bar="" dir={rtl ? 'rtl' : 'ltr'}>
        <Item data-slot="bottom-nav-item" value="home">
          Home
        </Item>
        <Item data-slot="bottom-nav-item" value="disabled" disabled>
          Disabled
        </Item>
        <Item data-slot="bottom-nav-item" value="profile" asChild>
          <a href="#profile">Profile</a>
        </Item>
        <span ref={lensRef} data-test-lens="" />
      </div>
    </Root>
  )
}

beforeEach(() => {
  frames = new Map()
  now = 0
  nextFrame = 0
  reduced = false
  captured = false
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), {
      get matches() {
        return reduced
      },
    })
  )
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
    return this.hasAttribute('data-test-bar') ? 254 : 82
  })
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function () {
    const siblings = Array.from(
      this.parentElement?.querySelectorAll('[data-slot="bottom-nav-item"]') ?? []
    )
    const index = siblings.indexOf(this)
    return 4 + (this.parentElement?.dir === 'rtl' ? 2 - index : index) * 82
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 254, 56)
  )
  vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => {
    captured = true
  })
  vi.spyOn(HTMLElement.prototype, 'hasPointerCapture').mockImplementation(() => captured)
  vi.spyOn(HTMLElement.prototype, 'releasePointerCapture').mockImplementation(() => {
    captured = false
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const lens = () => host.querySelector<HTMLElement>('[data-test-lens]')!
const item = (index: number) =>
  host.querySelectorAll<HTMLElement>('[data-slot="bottom-nav-item"]')[index]
const position = () => Number(lens().style.transform.match(/translate3d\(([-\d.]+)px/)?.[1])
async function advance(count = 120) {
  await act(async () => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60
      const pending = [...frames.values()]
      frames.clear()
      pending.forEach((callback) => callback(now))
    }
  })
}
async function pointer(type: string, x: number, target: EventTarget = window) {
  await act(async () =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: 28,
      })
    )
  )
}

describe('liquid bottom nav', () => {
  it('positions an uncontrolled selection in RTL and follows link selection', async () => {
    await act(async () => root.render(<Fixture rtl />))
    expect(position()).toBe(168)
    await act(async () => item(2).click())
    await advance()
    expect(item(2).getAttribute('aria-current')).toBe('page')
    expect(position()).toBe(4)
  })

  it('retargets an in-flight spring without jumping and stops scheduling frames', async () => {
    await act(async () => root.render(<Fixture />))
    await act(async () => item(2).click())
    await advance(5)
    const moving = position()
    expect(moving).toBeGreaterThan(4)
    expect(moving).toBeLessThan(168)
    await act(async () => item(0).click())
    expect(position()).toBe(moving)
    await advance()
    expect(position()).toBe(4)
    expect(frames.size).toBe(0)
  })

  it('commits a dragged link once, suppresses the extra pointer click, and ignores disabled tabs', async () => {
    const onChange = vi.fn()
    await act(async () => root.render(<Fixture onChange={onChange} />))
    await pointer('pointerdown', 45, item(0))
    await pointer('pointermove', 209)
    await pointer('pointerup', 209)
    await act(async () =>
      item(2).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, cancelable: true }))
    )
    expect(onChange).toHaveBeenCalledExactlyOnceWith('profile')
    expect(item(2).getAttribute('href')).toBe('#profile')
    await pointer('pointerdown', 209, item(2))
    await pointer('pointermove', 127)
    await pointer('pointerup', 127)
    await advance()
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(position()).toBe(168)
  })

  it('cancels a gesture without navigating and restores the selected position', async () => {
    const onChange = vi.fn()
    await act(async () => root.render(<Fixture onChange={onChange} />))
    await pointer('pointerdown', 45, item(0))
    await pointer('pointermove', 209)
    await advance(6)
    await pointer('pointercancel', 209)
    await advance()
    expect(onChange).not.toHaveBeenCalled()
    expect(position()).toBe(4)
    expect(captured).toBe(false)
  })

  it('respects reduced motion and cancels work on unmount', async () => {
    reduced = true
    await act(async () => root.render(<Fixture />))
    await act(async () => item(2).click())
    await advance(1)
    expect(position()).toBe(168)
    expect(lens().style.transform).toContain('scale(1, 1)')
    expect(frames.size).toBe(0)
    await act(async () => root.render(null))
    expect(frames.size).toBe(0)
  })

  it('keeps the liquid lens center neutral while retaining displacement at the rim', () => {
    const map = createLensMap(82, 48, 'pill', 10)
    const pixel = (x: number, y: number) => [
      ...map.pixels.slice((y * map.width + x) * 4, (y * map.width + x) * 4 + 2),
    ]
    expect(pixel(41, 24)).toEqual([128, 128])
    expect(pixel(41, 15)).toEqual([128, 128])
    expect(pixel(41, 4)).not.toEqual([128, 128])
    expect(map.scale).toBeLessThan(createLensMap(82, 48, 'pill').scale)
  })
})
