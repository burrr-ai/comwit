import { ThrottleOptions, throttle as throttleUtil } from '../utils'
import { AnyFunction, Interceptor, intercept } from './utils'

export function throttle<T extends AnyFunction>(
  waitMs: number,
  options?: ThrottleOptions
): Interceptor {
  return (next) => {
    const fn = function (this: unknown, ...args: Parameters<T>) {
      void (next as AnyFunction).apply(this, args)
    } as AnyFunction

    const throttled = throttleUtil(fn, waitMs, options)

    return function (this: unknown, ...args: Parameters<T>) {
      return (throttled as AnyFunction).apply(this, args)
    } as AnyFunction as T
  }
}

export function Throttle(waitMs: number, options?: ThrottleOptions): MethodDecorator {
  let throttledFn: Function | null = null
  return intercept({
    intercept: (execute, args) => {
      if (!throttledFn) {
        throttledFn = throttleUtil((...a: any[]) => execute(...a), waitMs, options)
      }
      return throttledFn(...args)
    },
  }) as MethodDecorator
}
