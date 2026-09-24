// @vitest-environment happy-dom
import { describe, test, expect, vi } from 'vitest'
import React from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { model, useModel, ComwitProvider } from '../src'

function createWrapper(providerProps: Record<string, any> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ComwitProvider {...providerProps}>{children}</ComwitProvider>
  }
}

describe('model lifecycle hooks', () => {
  test('onObserve fires on first subscription', () => {
    const onObserve = vi.fn()
    const counter = model({ count: 0 }, { onObserve })
    const wrapper = createWrapper()

    renderHook(() => useModel(counter), { wrapper })

    expect(onObserve).toHaveBeenCalledTimes(1)
  })

  test('cleanup fires when all subscribers unmount', () => {
    const cleanup = vi.fn()
    const onObserve = vi.fn(() => cleanup)
    const counter = model({ count: 0 }, { onObserve })
    const wrapper = createWrapper()

    const { unmount } = renderHook(() => useModel(counter), { wrapper })
    expect(cleanup).not.toHaveBeenCalled()

    unmount()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  test('onObserve does not fire on subsequent subscriptions (only 0→1)', () => {
    const onObserve = vi.fn()
    const counter = model({ count: 0 }, { onObserve })

    function Subscriber() {
      useModel(counter)
      return null
    }

    const { rerender } = render(
      <ComwitProvider>
        <Subscriber />
      </ComwitProvider>
    )
    expect(onObserve).toHaveBeenCalledTimes(1)

    // Add second subscriber — should not fire again
    rerender(
      <ComwitProvider>
        <Subscriber />
        <Subscriber />
      </ComwitProvider>
    )
    expect(onObserve).toHaveBeenCalledTimes(1)
  })

  test('cleanup fires only when last subscriber unmounts', () => {
    const cleanup = vi.fn()
    const onObserve = vi.fn(() => cleanup)
    const counter = model({ count: 0 }, { onObserve })

    function Subscriber() {
      useModel(counter)
      return null
    }

    const { rerender, unmount } = render(
      <ComwitProvider>
        <Subscriber />
        <Subscriber />
      </ComwitProvider>
    )

    // Remove one subscriber — cleanup should not fire yet
    rerender(
      <ComwitProvider>
        <Subscriber />
      </ComwitProvider>
    )
    expect(cleanup).not.toHaveBeenCalled()

    // Remove all subscribers
    unmount()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  test('multiple subscribe/unsubscribe cycles', () => {
    const cleanup = vi.fn()
    const onObserve = vi.fn(() => cleanup)
    const counter = model({ count: 0 }, { onObserve })
    const wrapper = createWrapper()

    // First cycle
    const { unmount: unmount1 } = renderHook(() => useModel(counter), { wrapper })
    expect(onObserve).toHaveBeenCalledTimes(1)
    unmount1()
    expect(cleanup).toHaveBeenCalledTimes(1)

    // Second cycle — should fire again
    const { unmount: unmount2 } = renderHook(() => useModel(counter), { wrapper })
    expect(onObserve).toHaveBeenCalledTimes(2)
    unmount2()
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  test('onObserve receives proxy state (mutations work)', async () => {
    let capturedState: { count: number } | null = null
    const counter = model(
      { count: 0 },
      {
        onObserve(state) {
          capturedState = state
          state.count = 42
        },
      }
    )
    const wrapper = createWrapper()

    const { result } = renderHook(() => useModel(counter), { wrapper })

    expect(capturedState).not.toBeNull()
    // The proxy mutation should propagate
    await act(async () => {})
    expect(result.current.count).toBe(42)
  })

  test('per-provider isolation', () => {
    const onObserve = vi.fn()
    const counter = model({ count: 0 }, { onObserve })

    const wrapper1 = createWrapper()
    const wrapper2 = createWrapper()

    renderHook(() => useModel(counter), { wrapper: wrapper1 })
    expect(onObserve).toHaveBeenCalledTimes(1)

    renderHook(() => useModel(counter), { wrapper: wrapper2 })
    expect(onObserve).toHaveBeenCalledTimes(2)
  })

  test('works with multiple models', () => {
    const onObserveA = vi.fn()
    const onObserveB = vi.fn()
    const modelA = model({ a: 1 }, { onObserve: onObserveA })
    const modelB = model({ b: 2 }, { onObserve: onObserveB })
    const wrapper = createWrapper()

    renderHook(
      () => {
        useModel(modelA)
        useModel(modelB)
      },
      { wrapper }
    )

    expect(onObserveA).toHaveBeenCalledTimes(1)
    expect(onObserveB).toHaveBeenCalledTimes(1)
  })

  test('model without onObserve works normally', () => {
    const counter = model({ count: 0 })
    const wrapper = createWrapper()

    const { result } = renderHook(() => useModel(counter), { wrapper })
    expect(result.current.count).toBe(0)
  })

  test('onObserve with no cleanup return works', () => {
    const onObserve = vi.fn() // returns undefined
    const counter = model({ count: 0 }, { onObserve })
    const wrapper = createWrapper()

    const { unmount } = renderHook(() => useModel(counter), { wrapper })
    expect(onObserve).toHaveBeenCalledTimes(1)

    // Should not throw when unmounting without cleanup
    unmount()
  })
})
