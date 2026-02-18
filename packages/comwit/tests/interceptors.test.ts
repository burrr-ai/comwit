import { onError } from '../src/interceptors/error'
import { onSuccess } from '../src/interceptors/success'
import { onAuthorized } from '../src/interceptors/authorized'
import { debounce } from '../src/interceptors/debounce'
import { throttle } from '../src/interceptors/throttle'
import { composeInterceptors, isThenable, createDecorator } from '../src/interceptors/utils'

describe('onError', () => {
  test('calls handler with error and re-throws on sync error', () => {
    const handler = vi.fn()
    const failing = () => {
      throw new Error('boom')
    }
    const wrapped = onError(handler)(failing)

    expect(() => wrapped()).toThrow('boom')
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }))
  })

  test('calls handler with rejection and rejects on async error', async () => {
    const handler = vi.fn()
    const failing = async () => {
      throw new Error('async boom')
    }
    const wrapped = onError(handler)(failing)

    await expect(wrapped()).rejects.toThrow('async boom')
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'async boom' }))
  })

  test('does not call handler when no error occurs', () => {
    const handler = vi.fn()
    const succeeding = () => 42
    const wrapped = onError(handler)(succeeding)

    expect(wrapped()).toBe(42)
    expect(handler).not.toHaveBeenCalled()
  })

  test('does not call handler when async function succeeds', async () => {
    const handler = vi.fn()
    const succeeding = async () => 'ok'
    const wrapped = onError(handler)(succeeding)

    await expect(wrapped()).resolves.toBe('ok')
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('onSuccess', () => {
  test('calls handler with sync return value', () => {
    const handler = vi.fn()
    const fn = () => 42
    const wrapped = onSuccess(handler)(fn)

    const result = wrapped()

    expect(handler).toHaveBeenCalledWith(42)
    expect(result).toBe(42)
  })

  test('calls handler with resolved value for async function', async () => {
    const handler = vi.fn()
    const fn = async () => 'hello'
    const wrapped = onSuccess(handler)(fn)

    const result = await wrapped()

    expect(handler).toHaveBeenCalledWith('hello')
    expect(result).toBe('hello')
  })

  test('returns original result, not handler return value', () => {
    const handler = vi.fn(() => 'ignored')
    const fn = () => 'original'
    const wrapped = onSuccess(handler)(fn)

    expect(wrapped()).toBe('original')
  })
})

describe('onAuthorized', () => {
  test('executes action when when() returns true', () => {
    const action = vi.fn(() => 'result')
    const onDeny = vi.fn()
    const wrapped = onAuthorized({ when: () => true, onDeny })(action)

    expect(wrapped()).toBe('result')
    expect(action).toHaveBeenCalled()
    expect(onDeny).not.toHaveBeenCalled()
  })

  test('calls onDeny and skips action when when() returns false', () => {
    const action = vi.fn(() => 'result')
    const onDeny = vi.fn()
    const wrapped = onAuthorized({ when: () => false, onDeny })(action)

    expect(wrapped()).toBeUndefined()
    expect(action).not.toHaveBeenCalled()
    expect(onDeny).toHaveBeenCalled()
  })

  test('handles async when() returning true', async () => {
    const action = vi.fn(() => 'result')
    const onDeny = vi.fn()
    const wrapped = onAuthorized({ when: async () => true, onDeny })(action)

    await expect(wrapped()).resolves.toBe('result')
    expect(action).toHaveBeenCalled()
    expect(onDeny).not.toHaveBeenCalled()
  })

  test('handles async when() returning false', async () => {
    const action = vi.fn(() => 'result')
    const onDeny = vi.fn()
    const wrapped = onAuthorized({ when: async () => false, onDeny })(action)

    await expect(wrapped()).resolves.toBeUndefined()
    expect(action).not.toHaveBeenCalled()
    expect(onDeny).toHaveBeenCalled()
  })

  test('returns undefined silently when onDeny is not provided', () => {
    const action = vi.fn(() => 'result')
    const wrapped = onAuthorized({ when: () => false } as any)(action)

    expect(wrapped()).toBeUndefined()
    expect(action).not.toHaveBeenCalled()
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('only executes the last call after wait period', () => {
    const fn = vi.fn()
    const wrapped = debounce(100)(fn)

    wrapped('a')
    wrapped('b')
    wrapped('c')

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  test('resets timer on each call', () => {
    const fn = vi.fn()
    const wrapped = debounce(100)(fn)

    wrapped('a')
    vi.advanceTimersByTime(50)
    wrapped('b')
    vi.advanceTimersByTime(50)

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('executes first call immediately, throttles subsequent calls', () => {
    const fn = vi.fn()
    const wrapped = throttle(100)(fn)

    wrapped('a')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')

    wrapped('b')
    wrapped('c')

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

describe('createDecorator', () => {
  test('modifies descriptor.value with interceptor', () => {
    const interceptor =
      (next: any) =>
      (...args: any[]) => {
        return next(...args) + ' wrapped'
      }
    const decorator = createDecorator(interceptor)

    const descriptor: PropertyDescriptor = {
      value: () => 'original',
      writable: true,
      configurable: true,
      enumerable: false,
    }

    decorator({}, 'method', descriptor as any)

    expect(descriptor.value()).toBe('original wrapped')
  })

  test('does nothing if descriptor.value is not a function', () => {
    const interceptor = vi.fn((next: any) => next)
    const decorator = createDecorator(interceptor)

    const descriptor: PropertyDescriptor = {
      value: 'not a function',
    }

    decorator({}, 'prop', descriptor as any)

    expect(interceptor).not.toHaveBeenCalled()
  })
})
