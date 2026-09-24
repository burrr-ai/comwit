import { OnError } from '../src/interceptors/error'
import { OnSuccess } from '../src/interceptors/success'
import { Authorized } from '../src/interceptors/authorized'
import { Debounce } from '../src/interceptors/debounce'
import { Throttle } from '../src/interceptors/throttle'
import { Retry } from '../src/interceptors/retry'
import { Queue } from '../src/interceptors/queue'
import { Log } from '../src/interceptors/log'
import {
  composeInterceptors,
  isThenable,
  intercept,
  getLazyInterceptorFactories,
} from '../src/interceptors/utils'

describe('OnError', () => {
  test('calls handler with error and re-throws on sync error', () => {
    const handler = vi.fn()

    class Actions {
      @OnError(handler)
      doSomething() {
        throw new Error('boom')
      }
    }

    const actions = new Actions()
    expect(() => actions.doSomething()).toThrow('boom')
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }))
  })

  test('calls handler with rejection and rejects on async error', async () => {
    const handler = vi.fn()

    class Actions {
      @OnError(handler)
      async doSomething() {
        throw new Error('async boom')
      }
    }

    const actions = new Actions()
    await expect(actions.doSomething()).rejects.toThrow('async boom')
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'async boom' }))
  })

  test('does not call handler when no error occurs', () => {
    const handler = vi.fn()

    class Actions {
      @OnError(handler)
      doSomething() {
        return 42
      }
    }

    const actions = new Actions()
    expect(actions.doSomething()).toBe(42)
    expect(handler).not.toHaveBeenCalled()
  })

  test('does not call handler when async function succeeds', async () => {
    const handler = vi.fn()

    class Actions {
      @OnError(handler)
      async doSomething() {
        return 'ok'
      }
    }

    const actions = new Actions()
    await expect(actions.doSomething()).resolves.toBe('ok')
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('OnSuccess', () => {
  test('calls handler with sync return value', () => {
    const handler = vi.fn()

    class Actions {
      @OnSuccess(handler)
      doSomething() {
        return 42
      }
    }

    const actions = new Actions()
    const result = actions.doSomething()

    expect(handler).toHaveBeenCalledWith(42)
    expect(result).toBe(42)
  })

  test('calls handler with resolved value for async function', async () => {
    const handler = vi.fn()

    class Actions {
      @OnSuccess(handler)
      async doSomething() {
        return 'hello'
      }
    }

    const actions = new Actions()
    const result = await actions.doSomething()

    expect(handler).toHaveBeenCalledWith('hello')
    expect(result).toBe('hello')
  })

  test('returns original result, not handler return value', () => {
    const handler = vi.fn(() => 'ignored')

    class Actions {
      @OnSuccess(handler)
      doSomething() {
        return 'original'
      }
    }

    const actions = new Actions()
    expect(actions.doSomething()).toBe('original')
  })
})

describe('Authorized', () => {
  test('executes action when when() returns true', () => {
    const onDeny = vi.fn()

    class Actions {
      @Authorized({ when: () => true, onDeny })
      doSomething() {
        return 'result'
      }
    }

    const actions = new Actions()
    expect(actions.doSomething()).toBe('result')
    expect(onDeny).not.toHaveBeenCalled()
  })

  test('calls onDeny and skips action when when() returns false', () => {
    const action = vi.fn()
    const onDeny = vi.fn()

    class Actions {
      @Authorized({ when: () => false, onDeny })
      doSomething() {
        action()
        return 'result'
      }
    }

    const actions = new Actions()
    expect(actions.doSomething()).toBeUndefined()
    expect(action).not.toHaveBeenCalled()
    expect(onDeny).toHaveBeenCalled()
  })

  test('handles async when() returning true', async () => {
    const onDeny = vi.fn()

    class Actions {
      @Authorized({ when: async () => true, onDeny })
      doSomething() {
        return 'result'
      }
    }

    const actions = new Actions()
    await expect(actions.doSomething()).resolves.toBe('result')
    expect(onDeny).not.toHaveBeenCalled()
  })

  test('handles async when() returning false', async () => {
    const action = vi.fn()
    const onDeny = vi.fn()

    class Actions {
      @Authorized({ when: async () => false, onDeny })
      doSomething() {
        action()
        return 'result'
      }
    }

    const actions = new Actions()
    await expect(actions.doSomething()).resolves.toBeUndefined()
    expect(action).not.toHaveBeenCalled()
    expect(onDeny).toHaveBeenCalled()
  })

  test('returns undefined silently when onDeny is not provided', () => {
    const action = vi.fn()

    class Actions {
      @Authorized({ when: () => false } as any)
      doSomething() {
        action()
        return 'result'
      }
    }

    const actions = new Actions()
    expect(actions.doSomething()).toBeUndefined()
    expect(action).not.toHaveBeenCalled()
  })
})

describe('Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('only executes the last call after wait period', () => {
    const fn = vi.fn()

    class Actions {
      @Debounce(100)
      doSomething(...args: any[]) {
        fn(...args)
      }
    }

    const actions = new Actions()
    actions.doSomething('a')
    actions.doSomething('b')
    actions.doSomething('c')

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  test('resets timer on each call', () => {
    const fn = vi.fn()

    class Actions {
      @Debounce(100)
      doSomething(...args: any[]) {
        fn(...args)
      }
    }

    const actions = new Actions()
    actions.doSomething('a')
    vi.advanceTimersByTime(50)
    actions.doSomething('b')
    vi.advanceTimersByTime(50)

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
  })
})

describe('Throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('executes first call immediately, throttles subsequent calls', () => {
    const fn = vi.fn()

    class Actions {
      @Throttle(100)
      doSomething(...args: any[]) {
        fn(...args)
      }
    }

    const actions = new Actions()
    actions.doSomething('a')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')

    actions.doSomething('b')
    actions.doSomething('c')

    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('composeInterceptors', () => {
  test('composes interceptors in right-to-left order', () => {
    const order: string[] = []

    const first =
      (next: any) =>
      (...args: any[]) => {
        order.push('first')
        return next(...args)
      }
    const second =
      (next: any) =>
      (...args: any[]) => {
        order.push('second')
        return next(...args)
      }

    const composed = composeInterceptors([first, second])
    const fn = () => {
      order.push('original')
      return 'done'
    }

    const wrapped = composed(fn)
    const result = wrapped()

    expect(order).toEqual(['first', 'second', 'original'])
    expect(result).toBe('done')
  })

  test('single interceptor wraps the function', () => {
    const interceptor =
      (next: any) =>
      (...args: any[]) => {
        return next(...args) + '!'
      }
    const composed = composeInterceptors([interceptor])
    const fn = () => 'hello'

    expect(composed(fn)()).toBe('hello!')
  })
})

describe('isThenable', () => {
  test('returns true for a Promise', () => {
    expect(isThenable(Promise.resolve(1))).toBe(true)
  })

  test('returns true for an object with .then method', () => {
    expect(isThenable({ then: () => {} })).toBe(true)
  })

  test('returns false for null', () => {
    expect(isThenable(null)).toBe(false)
  })

  test('returns false for a number', () => {
    expect(isThenable(42)).toBe(false)
  })

  test('returns false for a string', () => {
    expect(isThenable('hello')).toBe(false)
  })

  test('returns false for an object without .then', () => {
    expect(isThenable({ foo: 'bar' })).toBe(false)
  })
})

describe('intercept', () => {
  test('onBefore is called with args before method executes', () => {
    const order: string[] = []
    const onBefore = vi.fn((...args: any[]) => {
      order.push('before')
    })

    const Log = intercept({ onBefore })

    class Actions {
      @Log
      doSomething(a: number, b: number) {
        order.push('execute')
        return a + b
      }
    }

    const actions = new Actions()
    const result = actions.doSomething(1, 2)

    expect(onBefore).toHaveBeenCalledWith(1, 2)
    expect(order).toEqual(['before', 'execute'])
    expect(result).toBe(3)
  })

  test('onSuccess is called with result after sync method succeeds', () => {
    const onSuccess = vi.fn()

    const Log = intercept({ onSuccess })

    class Actions {
      @Log
      doSomething() {
        return 42
      }
    }

    const actions = new Actions()
    const result = actions.doSomething()

    expect(onSuccess).toHaveBeenCalledWith(42)
    expect(result).toBe(42)
  })

  test('onSuccess async is called with resolved value after async method succeeds', async () => {
    const onSuccess = vi.fn()

    const Log = intercept({ onSuccess })

    class Actions {
      @Log
      async doSomething() {
        return 'hello'
      }
    }

    const actions = new Actions()
    const result = await actions.doSomething()

    expect(onSuccess).toHaveBeenCalledWith('hello')
    expect(result).toBe('hello')
  })

  test('onError is called with error on sync throw, error re-thrown', () => {
    const onError = vi.fn()

    const Log = intercept({ onError })

    class Actions {
      @Log
      doSomething() {
        throw new Error('boom')
      }
    }

    const actions = new Actions()
    expect(() => actions.doSomething()).toThrow('boom')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }))
  })

  test('onError async is called with error on async rejection, error re-thrown', async () => {
    const onError = vi.fn()

    const Log = intercept({ onError })

    class Actions {
      @Log
      async doSomething() {
        throw new Error('async boom')
      }
    }

    const actions = new Actions()
    await expect(actions.doSomething()).rejects.toThrow('async boom')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'async boom' }))
  })

  test('onSettled is called after success', () => {
    const onSettled = vi.fn()

    const Log = intercept({ onSettled })

    class Actions {
      @Log
      doSomething() {
        return 'ok'
      }
    }

    const actions = new Actions()
    actions.doSomething()
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  test('onSettled is called after error (finally semantics)', () => {
    const onSettled = vi.fn()

    const Log = intercept({ onSettled })

    class Actions {
      @Log
      doSomething() {
        throw new Error('fail')
      }
    }

    const actions = new Actions()
    expect(() => actions.doSomething()).toThrow('fail')
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  test('intercept controls execution (can skip execute)', () => {
    const interceptHook = vi.fn(() => 'intercepted')
    const fn = vi.fn()

    const Skip = intercept({ intercept: interceptHook })

    class Actions {
      @Skip
      doSomething() {
        fn()
        return 'original'
      }
    }

    const actions = new Actions()
    const result = actions.doSomething()

    expect(result).toBe('intercepted')
    expect(fn).not.toHaveBeenCalled()
  })

  test('intercept with execute calls execute and returns result', () => {
    const interceptHook = vi.fn((execute: any, args: any[]) => {
      return execute(...args)
    })

    const Wrap = intercept({ intercept: interceptHook })

    class Actions {
      @Wrap
      doSomething(x: number) {
        return x * 2
      }
    }

    const actions = new Actions()
    const result = actions.doSomething(5)

    expect(result).toBe(10)
    expect(interceptHook).toHaveBeenCalledTimes(1)
  })

  test('class decorator applies to all methods', () => {
    const handler = vi.fn()
    const MyDecorator = intercept({ onSuccess: handler })

    @MyDecorator
    class Actions {
      doA() {
        return 'a'
      }
      doB() {
        return 'b'
      }
    }

    const actions = new Actions()
    actions.doA()
    actions.doB()
    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledWith('a')
    expect(handler).toHaveBeenCalledWith('b')
  })

  test('class + method coexistence — class-level applies to methods without their own', () => {
    const classHandler = vi.fn()
    const methodHandler = vi.fn()
    const ClassLog = intercept({ onSuccess: classHandler })
    const MethodLog = intercept({ onSuccess: methodHandler })

    @ClassLog
    class Actions {
      @MethodLog
      doA() {
        return 'a'
      }
      doB() {
        return 'b'
      }
    }

    const actions = new Actions()
    actions.doA()
    actions.doB()

    // doA has its own method decorator, plus the class decorator wraps it too
    // doB only has the class decorator
    expect(methodHandler).toHaveBeenCalledTimes(1)
    expect(methodHandler).toHaveBeenCalledWith('a')
    expect(classHandler).toHaveBeenCalledTimes(2)
  })

  test('full pipeline — onBefore → execute → onSuccess → onSettled in correct order', () => {
    const order: string[] = []

    const Pipeline = intercept({
      onBefore: () => {
        order.push('onBefore')
      },
      onSuccess: () => {
        order.push('onSuccess')
      },
      onSettled: () => {
        order.push('onSettled')
      },
    })

    class Actions {
      @Pipeline
      doSomething() {
        order.push('execute')
        return 'done'
      }
    }

    const actions = new Actions()
    actions.doSomething()

    expect(order).toEqual(['onBefore', 'execute', 'onSuccess', 'onSettled'])
  })

  test('lazy factory stores interceptor for deferred resolution', () => {
    const factory = vi.fn(() => ({
      onBefore: () => {},
    }))

    const Lazy = intercept(factory)

    class Actions {
      @Lazy
      doSomething() {
        return 'result'
      }
    }

    // Factory should NOT have been called at decoration time
    expect(factory).not.toHaveBeenCalled()
  })

  test('lazy factory stores interceptor factories on the method', () => {
    const factory = vi.fn(() => ({
      onBefore: () => {},
    }))

    const Lazy = intercept(factory)

    class Actions {
      @Lazy
      doSomething() {
        return 'result'
      }
    }

    const descriptor = Object.getOwnPropertyDescriptor(Actions.prototype, 'doSomething')
    const factories = getLazyInterceptorFactories(descriptor!.value)

    expect(factories).toHaveLength(1)
    expect(typeof factories[0]).toBe('function')
  })

  test('lazy factory receives ActionContext when resolved', () => {
    const innerFactory = vi.fn(() => ({
      onBefore: () => {},
    }))

    const Lazy = intercept(innerFactory)

    class Actions {
      @Lazy
      doSomething() {
        return 'result'
      }
    }

    const descriptor = Object.getOwnPropertyDescriptor(Actions.prototype, 'doSomething')
    const factories = getLazyInterceptorFactories(descriptor!.value)

    const mockCtx = { state: vi.fn(), context: { token: 'abc' } }
    factories[0](mockCtx as any)

    expect(innerFactory).toHaveBeenCalledWith(mockCtx)
  })

  test('lazy factory hooks work after manual resolution', () => {
    const onBefore = vi.fn()
    const onSuccess = vi.fn()

    const Lazy = intercept(() => ({ onBefore, onSuccess }))

    class Actions {
      @Lazy
      doSomething(x: number) {
        return x * 3
      }
    }

    const descriptor = Object.getOwnPropertyDescriptor(Actions.prototype, 'doSomething')
    const factories = getLazyInterceptorFactories(descriptor!.value)

    const mockCtx = { state: vi.fn(), context: {} }
    const methodDecorator = factories[0](mockCtx as any)

    // Apply the resolved Stage 3 decorator to a test function
    const testFn = function (x: number) {
      return x + 10
    }

    const wrapped = methodDecorator(testFn, { kind: 'method', name: 'testMethod' } as any) ?? testFn

    const result = (wrapped as any)(5)

    expect(onBefore).toHaveBeenCalledWith(5)
    expect(onSuccess).toHaveBeenCalledWith(15, 5)
    expect(result).toBe(15)
  })

  test('lazy class decorator stores factories on all prototype methods', () => {
    const factory = vi.fn(() => ({
      onBefore: () => {},
    }))

    const Lazy = intercept(factory)

    @Lazy
    class Actions {
      doA() {
        return 'a'
      }
      doB() {
        return 'b'
      }
    }

    const factoriesA = getLazyInterceptorFactories(
      Object.getOwnPropertyDescriptor(Actions.prototype, 'doA')!.value
    )
    const factoriesB = getLazyInterceptorFactories(
      Object.getOwnPropertyDescriptor(Actions.prototype, 'doB')!.value
    )

    expect(factoriesA).toHaveLength(1)
    expect(factoriesB).toHaveLength(1)
    // Factory should not have been called at decoration time
    expect(factory).not.toHaveBeenCalled()
  })

  test('multiple lazy interceptors can be stacked', () => {
    const factoryA = vi.fn(() => ({
      onBefore: () => {},
    }))
    const factoryB = vi.fn(() => ({
      onSuccess: () => {},
    }))

    const LazyA = intercept(factoryA)
    const LazyB = intercept(factoryB)

    class Actions {
      @LazyA
      @LazyB
      doSomething() {
        return 'result'
      }
    }

    const descriptor = Object.getOwnPropertyDescriptor(Actions.prototype, 'doSomething')
    const factories = getLazyInterceptorFactories(descriptor!.value)

    expect(factories).toHaveLength(2)
    expect(factoryA).not.toHaveBeenCalled()
    expect(factoryB).not.toHaveBeenCalled()

    // Resolve both and verify they call the correct inner factories
    const mockCtx = { state: vi.fn(), context: {} }
    factories[0](mockCtx as any)
    factories[1](mockCtx as any)

    expect(factoryB).toHaveBeenCalledWith(mockCtx)
    expect(factoryA).toHaveBeenCalledWith(mockCtx)
  })
})

describe('Retry', () => {
  test('retries on failure and succeeds on nth attempt', async () => {
    let attempt = 0

    class Actions {
      @Retry(3)
      async doSomething() {
        attempt++
        if (attempt < 3) throw new Error('fail')
        return 'success'
      }
    }

    const actions = new Actions()
    const result = await actions.doSomething()

    expect(result).toBe('success')
    expect(attempt).toBe(3)
  })

  test('throws last error after all retries exhausted', async () => {
    class Actions {
      @Retry(2)
      async doSomething() {
        throw new Error('always fails')
      }
    }

    const actions = new Actions()
    await expect(actions.doSomething()).rejects.toThrow('always fails')
  })

  test('respects delay between retries', async () => {
    vi.useFakeTimers()
    let attempt = 0

    class Actions {
      @Retry(2, { delay: 100 })
      async doSomething() {
        attempt++
        if (attempt < 3) throw new Error('fail')
        return 'ok'
      }
    }

    const actions = new Actions()
    const promise = actions.doSomething()

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0)
    expect(attempt).toBe(1)

    // Wait for first delay
    await vi.advanceTimersByTimeAsync(100)
    expect(attempt).toBe(2)

    // Wait for second delay
    await vi.advanceTimersByTimeAsync(100)
    const result = await promise
    expect(result).toBe('ok')
    expect(attempt).toBe(3)

    vi.useRealTimers()
  })

  test('exponential backoff increases delay', async () => {
    vi.useFakeTimers()
    let attempt = 0

    class Actions {
      @Retry(3, { delay: 100, backoff: 'exponential' })
      async doSomething() {
        attempt++
        if (attempt < 4) throw new Error('fail')
        return 'ok'
      }
    }

    const actions = new Actions()
    const promise = actions.doSomething()

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0)
    expect(attempt).toBe(1)

    // First retry: delay = 100 * 2^0 = 100ms
    await vi.advanceTimersByTimeAsync(100)
    expect(attempt).toBe(2)

    // Second retry: delay = 100 * 2^1 = 200ms
    await vi.advanceTimersByTimeAsync(200)
    expect(attempt).toBe(3)

    // Third retry: delay = 100 * 2^2 = 400ms
    await vi.advanceTimersByTimeAsync(400)
    const result = await promise
    expect(result).toBe('ok')
    expect(attempt).toBe(4)

    vi.useRealTimers()
  })
})

describe('Queue', () => {
  test("'drop' ignores concurrent calls", async () => {
    let resolveFirst!: (value: string) => void
    let callCount = 0

    class Actions {
      @Queue('drop')
      async doSomething(id: number) {
        callCount++
        if (id === 1) {
          return new Promise<string>((resolve) => {
            resolveFirst = resolve
          })
        }
        return `result-${id}`
      }
    }

    const actions = new Actions()
    const first = actions.doSomething(1)
    const second = actions.doSomething(2)

    // second call should return same promise as first (dropped)
    resolveFirst('first-done')
    const result1 = await first
    const result2 = await second

    expect(result1).toBe('first-done')
    // The second call was dropped, so it got the first call's result
    expect(result2).toBe('first-done')
    expect(callCount).toBe(1)
  })

  test("'queue' executes sequentially", async () => {
    const order: number[] = []
    let resolvers: Array<() => void> = []

    class Actions {
      @Queue('queue')
      async doSomething(id: number) {
        await new Promise<void>((resolve) => {
          resolvers.push(resolve)
        })
        order.push(id)
        return `result-${id}`
      }
    }

    const actions = new Actions()
    const p1 = actions.doSomething(1)
    const p2 = actions.doSomething(2)

    // First call is executing, second is queued
    await vi.waitFor(() => expect(resolvers).toHaveLength(1))
    resolvers[0]()

    await vi.waitFor(() => expect(resolvers).toHaveLength(2))
    resolvers[1]()

    const r1 = await p1
    const r2 = await p2

    expect(r1).toBe('result-1')
    expect(r2).toBe('result-2')
    expect(order).toEqual([1, 2])
  })

  test("'replace' only latest result is kept", async () => {
    let resolvers: Array<(value: string) => void> = []

    class Actions {
      @Queue('replace')
      async doSomething(id: number) {
        return new Promise<string>((resolve) => {
          resolvers.push((val) => resolve(val))
        })
      }
    }

    const actions = new Actions()
    const p1 = actions.doSomething(1)
    const p2 = actions.doSomething(2)

    // Resolve in order: first, then second
    resolvers[0]('first-result')
    resolvers[1]('second-result')

    const r1 = await p1
    const r2 = await p2

    // First call's result is discarded (stale)
    expect(r1).toBeUndefined()
    // Latest call's result is kept
    expect(r2).toBe('second-result')
  })
})

describe('Log', () => {
  test('logs method name and args on call', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    class Actions {
      @Log()
      doSomething(a: number, b: string) {
        return `${a}-${b}`
      }
    }

    const actions = new Actions()
    actions.doSomething(1, 'hello')

    expect(spy).toHaveBeenCalledWith('called with', [1, 'hello'])
    spy.mockRestore()
  })

  test('logs result on success', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    class Actions {
      @Log()
      doSomething() {
        return 42
      }
    }

    const actions = new Actions()
    actions.doSomething()

    expect(spy).toHaveBeenCalledWith('returned', 42)
    spy.mockRestore()
  })

  test('logs error on failure', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    class Actions {
      @Log()
      doSomething() {
        throw new Error('boom')
      }
    }

    const actions = new Actions()
    expect(() => actions.doSomething()).toThrow('boom')

    expect(spy).toHaveBeenCalledWith('threw', expect.objectContaining({ message: 'boom' }))
    spy.mockRestore()
  })
})
