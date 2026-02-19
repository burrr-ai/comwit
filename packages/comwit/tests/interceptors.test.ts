import { OnError } from '../src/interceptors/error'
import { OnSuccess } from '../src/interceptors/success'
import { Authorized } from '../src/interceptors/authorized'
import { Debounce } from '../src/interceptors/debounce'
import { Throttle } from '../src/interceptors/throttle'
import { composeInterceptors, isThenable, intercept } from '../src/interceptors/utils'

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
})
