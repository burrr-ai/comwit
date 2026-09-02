// @vitest-environment happy-dom
import React, { useSyncExternalStore } from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { model, silent } from '../src'
import { isSilent } from '../src/core/silent'

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('silent() and React external-store consistency', () => {
  test('keeps the outer silent scope active after a nested call', () => {
    const counter = model({ count: 0 })
    const store = counter.instance()
    const listener = vi.fn()
    store.subscribe(listener)

    silent(() => {
      store.proxy.count = 1
      silent(() => {
        store.proxy.count = 2
      })

      expect(isSilent()).toBe(true)
      store.proxy.count = 3
    })

    expect(isSilent()).toBe(false)
    expect(listener).not.toHaveBeenCalled()
    expect(store.getSnapshot().count).toBe(3)
  })

  test('restores a nested silent scope after an exception', () => {
    silent(() => {
      expect(() =>
        silent(() => {
          throw new Error('nested failure')
        })
      ).toThrow('nested failure')
      expect(isSilent()).toBe(true)
    })

    expect(isSilent()).toBe(false)
  })

  test('cannot hide a render-time mutation from React snapshot checks', async () => {
    const counter = model({ count: 0 })
    const store = counter.instance()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    let renders = 0

    function RenderTimeInitializer() {
      const count = useSyncExternalStore(
        store.subscribe,
        () => store.getSnapshot().count,
        () => store.getSnapshot().count
      )
      renders++

      if (count === 0) {
        silent(() => {
          store.proxy.count = 1
        })
      }

      return <span>{count}</span>
    }

    render(<RenderTimeInitializer />)

    await waitFor(() => expect(document.body.textContent).toBe('1'))
    expect(listener).not.toHaveBeenCalled()
    expect(renders).toBe(2)
    unsubscribe()
  })
})
