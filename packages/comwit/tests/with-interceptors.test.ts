import { withInterceptors } from '../src/interceptors/with-interceptors'
import { onError } from '../src/interceptors/error'
import { onSuccess } from '../src/interceptors/success'
import { retry } from '../src/interceptors/retry'
import { queue } from '../src/interceptors/queue'
import { log } from '../src/interceptors/log'

describe('withInterceptors', () => {
  test('applies a single interceptor to a method', () => {
    const handler = vi.fn()

    const actions = withInterceptors(
      {
        doSomething() {
          throw new Error('boom')
        },
      },
      {
        doSomething: onError(handler),
      }
    )

    expect(() => actions.doSomething()).toThrow('boom')
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }))
  })

  test('applies an array of interceptors to a method', () => {
    const errorHandler = vi.fn()
    const successHandler = vi.fn()

    const actions = withInterceptors(
      {
        succeed() {
          return 42
        },
        fail() {
          throw new Error('fail')
        },
      },
      {
        succeed: [onSuccess(successHandler)],
        fail: [onError(errorHandler)],
      }
    )

    actions.succeed()
    expect(successHandler).toHaveBeenCalledWith(42)

    expect(() => actions.fail()).toThrow('fail')
    expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ message: 'fail' }))
  })

  test('applies interceptors left-to-right (first = innermost)', async () => {
    const callOrder: string[] = []

    const inner =
      (next: any) =>
      (...args: any[]) => {
        callOrder.push('inner-before')
        const result = next(...args)
        callOrder.push('inner-after')
        return result
      }

    const outer =
      (next: any) =>
      (...args: any[]) => {
        callOrder.push('outer-before')
        const result = next(...args)
        callOrder.push('outer-after')
        return result
      }

    const actions = withInterceptors(
      {
        doIt() {
          callOrder.push('execute')
          return 'done'
        },
      },
      {
        doIt: [inner, outer],
      }
    )

    actions.doIt()
    expect(callOrder).toEqual([
      'outer-before',
      'inner-before',
      'execute',
      'inner-after',
      'outer-after',
    ])
  })

  test('leaves methods without interceptors unchanged', () => {
    const actions = withInterceptors(
      {
        intercepted() {
          return 'a'
        },
        plain() {
          return 'b'
        },
      },
      {
        intercepted: onSuccess(() => {}),
      }
    )

    expect(actions.plain()).toBe('b')
  })

  test('ignores interceptor keys that do not exist in methods', () => {
    const actions = withInterceptors(
      {
        real() {
          return 1
        },
      },
      {
        real: onSuccess(() => {}),
        nonexistent: onSuccess(() => {}),
      } as any
    )

    expect(actions.real()).toBe(1)
    expect((actions as any).nonexistent).toBeUndefined()
  })

  test('works with async methods and retry interceptor', async () => {
    let attempts = 0

    const actions = withInterceptors(
      {
        async fetchData() {
          attempts++
          if (attempts < 3) throw new Error('transient')
          return 'ok'
        },
      },
      {
        fetchData: retry(3),
      }
    )

    const result = await actions.fetchData()
    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  test('composes onError and retry correctly', async () => {
    const errorHandler = vi.fn()
    let attempts = 0

    const actions = withInterceptors(
      {
        async unstable() {
          attempts++
          throw new Error('always fails')
        },
      },
      {
        unstable: [onError(errorHandler), retry(2)],
      }
    )

    await expect(actions.unstable()).rejects.toThrow('always fails')
    // onError is inner, retry is outer. Retry calls the onError-wrapped function
    // 3 times (1 initial + 2 retries). Each failure triggers onError handler.
    expect(attempts).toBe(3)
    expect(errorHandler).toHaveBeenCalledTimes(3)
  })

  test('preserves this binding when used with normalizeActions pattern', () => {
    const handler = vi.fn()

    const obj = {
      value: 10,
      getValue() {
        return this.value
      },
    }

    const intercepted = withInterceptors(obj, {
      getValue: onSuccess(handler),
    })

    // this refers to the intercepted object
    expect(intercepted.getValue()).toBe(10)
    expect(handler).toHaveBeenCalledWith(10)
  })

  test('returns a new object without mutating the original', () => {
    const original = {
      method() {
        return 1
      },
    }

    const intercepted = withInterceptors(original, {
      method: onSuccess(() => {}),
    })

    expect(intercepted).not.toBe(original)
    expect(intercepted.method).not.toBe(original.method)
  })
})
