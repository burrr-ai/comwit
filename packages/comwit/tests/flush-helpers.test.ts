import { Debounce, flushDebounce, cancelDebounce } from '../src/interceptors/debounce'
import { Throttle, flushThrottle, cancelThrottle } from '../src/interceptors/throttle'
import { OnError } from '../src/interceptors/error'
import { action } from '../src/core/action'
import { model } from '../src/core/model'

describe('flushDebounce / cancelDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('flushes a pending debounced call immediately and resolves with its return value', async () => {
    const fn = vi.fn(() => 42)

    class Actions {
      @Debounce(100)
      doSomething(...args: any[]) {
        return fn(...args)
      }
    }

    const actions = new Actions()
    actions.doSomething('a')

    expect(fn).not.toHaveBeenCalled()

    const result = await flushDebounce(actions, 'doSomething')

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
    expect(result).toBe(42)
  })

  test('flushDebounce is a no-op when nothing is pending (resolves to undefined)', async () => {
    const fn = vi.fn()

    class Actions {
      @Debounce(100)
      doSomething() {
        fn()
      }
    }

    const actions = new Actions()
    const result = await flushDebounce(actions, 'doSomething')

    expect(fn).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  test('flushDebounce on a method that has never been registered resolves to undefined', async () => {
    class Actions {
      @Debounce(100)
      doSomething() {}
    }

    const actions = new Actions()
    // No call has been made — registry has no entry yet.
    const result = await flushDebounce(actions, 'doSomething')
    expect(result).toBeUndefined()
  })

  test('cancelDebounce drops the pending call: it does not fire after the wait period', () => {
    const fn = vi.fn()

    class Actions {
      @Debounce(100)
      doSomething(...args: any[]) {
        fn(...args)
      }
    }

    const actions = new Actions()
    actions.doSomething('a')
    cancelDebounce(actions, 'doSomething')

    vi.advanceTimersByTime(500)

    expect(fn).not.toHaveBeenCalled()
  })

  test('cancelDebounce on an empty/unregistered method is a no-op', () => {
    class Actions {
      @Debounce(100)
      doSomething() {}
    }

    const actions = new Actions()

    // Both forms must not throw:
    expect(() => cancelDebounce(actions, 'doSomething')).not.toThrow()
  })

  test('decorator stack: flush propagates errors through @OnError', async () => {
    const onErr = vi.fn()
    const boom = new Error('boom')

    class Actions {
      @OnError(onErr)
      @Debounce(100)
      async doSomething() {
        throw boom
      }
    }

    const actions = new Actions()
    // Caller's pending promise — `actions.doSomething()` returns a Promise
    // that rejects once the trailing call fires. We attach a sink so it
    // doesn't surface as an unhandled rejection.
    const pending = (actions.doSomething() as unknown as Promise<unknown>).catch(() => {})

    // Flush executes the debounced body now and propagates the rejection
    // through `@OnError`'s wrapping `.then(_, onError)` in `wrapWithHooks`.
    const flushed = flushDebounce(actions, 'doSomething').catch(() => {})

    await pending
    await flushed

    expect(onErr).toHaveBeenCalled()
    expect(onErr.mock.calls[0]?.[0]).toBe(boom)
  })

  test('multiple instances are isolated: flushing one does not affect the other', async () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    class Actions {
      private spy: () => void
      constructor(spy: () => void) {
        this.spy = spy
      }

      @Debounce(100)
      doSomething() {
        this.spy()
      }
    }

    const a = new Actions(fn1)
    const b = new Actions(fn2)

    a.doSomething()
    b.doSomething()

    await flushDebounce(a, 'doSomething')

    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()

    // Advance and let b's pending call fire normally.
    vi.advanceTimersByTime(100)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  test('cross-slice: flushDebounce against the merged useAction object resolves to the registered slice instance', async () => {
    const persisted: string[] = []

    const draftModel = model({ value: '' })

    const draftActions = action(({ state }) => {
      const m = state(draftModel)
      class DraftActions {
        @Debounce(100)
        async persistSoon() {
          persisted.push(m.value)
        }
      }
      return new DraftActions()
    })

    const localActions = action(() => {
      class LocalActions {
        nudge() {
          // no-op, just to have a second slice
        }
      }
      return new LocalActions()
    })

    // Manually compose like useAction (no React here)
    const ctx: any = {
      state: <T extends object>(_m: { key: symbol; instance: () => any }) => {
        // For this test, just return the model's instance proxy directly.
        return _m.instance().proxy
      },
      context: {},
    }

    const merged = Object.assign(
      {},
      draftActions(ctx) as Record<string, unknown>,
      localActions(ctx) as Record<string, unknown>
    ) as Record<string, any>

    merged.persistSoon()
    expect(persisted).toEqual([])

    await flushDebounce(merged, 'persistSoon')

    expect(persisted).toHaveLength(1)
  })
})

describe('flushThrottle / cancelThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('flushes the trailing call queued behind the throttle window', () => {
    const fn = vi.fn()

    class Actions {
      @Throttle(100)
      doSomething(...args: any[]) {
        fn(...args)
      }
    }

    const actions = new Actions()
    actions.doSomething('a') // executes immediately (leading)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')

    actions.doSomething('b') // queued for trailing
    actions.doSomething('c') // replaces 'b'

    flushThrottle(actions, 'doSomething')

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('c')
  })

  test('flushThrottle is a no-op when nothing is pending', async () => {
    class Actions {
      @Throttle(100)
      doSomething() {}
    }

    const actions = new Actions()
    const result = await flushThrottle(actions, 'doSomething')
    expect(result).toBeUndefined()
  })

  test('cancelThrottle drops the trailing call', () => {
    const fn = vi.fn()

    class Actions {
      @Throttle(100)
      doSomething(...args: any[]) {
        fn(...args)
      }
    }

    const actions = new Actions()
    actions.doSomething('a') // leading
    actions.doSomething('b') // queued
    cancelThrottle(actions, 'doSomething')

    vi.advanceTimersByTime(500)

    // Only the leading 'a' fired.
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  test('decorator stack: flushed throttle errors propagate through @OnError', async () => {
    const onErr = vi.fn()
    const boom = new Error('boom-throttle')

    class Actions {
      @OnError(onErr)
      @Throttle(100)
      async doSomething(_label: string) {
        throw boom
      }
    }

    const actions = new Actions()
    // First call fires leading and rejects → `@OnError` sees it.
    const leading = (actions.doSomething('first') as unknown as Promise<unknown>).catch(() => {})
    await leading
    expect(onErr).toHaveBeenCalledTimes(1)

    // Queue a trailing call, then flush. Both the queued caller's promise
    // and the helper's flush promise reject — sink both.
    const queued = (actions.doSomething('second') as unknown as Promise<unknown>).catch(() => {})
    const flushed = flushThrottle(actions, 'doSomething').catch(() => {})
    await queued
    await flushed

    expect(onErr).toHaveBeenCalledTimes(2)
    expect(onErr.mock.calls[1]?.[0]).toBe(boom)
  })

  test('multiple instances are isolated for throttle as well', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    class Actions {
      private spy: (label: string) => void
      constructor(spy: (label: string) => void) {
        this.spy = spy
      }

      @Throttle(100)
      doSomething(label: string) {
        this.spy(label)
      }
    }

    const a = new Actions(fn1)
    const b = new Actions(fn2)

    a.doSomething('a-leading')
    b.doSomething('b-leading')
    a.doSomething('a-trailing')
    b.doSomething('b-trailing')

    flushThrottle(a, 'doSomething')

    // a fired leading + flushed-trailing; b only fired leading (still waiting).
    expect(fn1).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenCalledTimes(1)
  })
})
