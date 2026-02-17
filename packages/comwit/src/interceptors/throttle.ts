import { ThrottleOptions, throttle as throttleUtil } from '../utils'
import { AnyFunction, createDecorator, Interceptor } from './utils'

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
  return createDecorator(throttle(waitMs, options))
}
