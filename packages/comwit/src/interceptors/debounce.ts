import { DebounceOptions, debounce as debounceUtil } from '../utils'
import { AnyFunction, Interceptor, intercept } from './utils'

export function debounce<T extends AnyFunction>(
  waitMs: number,
  options?: DebounceOptions
): Interceptor {
  return (next) => {
    const fn = function (this: unknown, ...args: Parameters<T>) {
      void (next as AnyFunction).apply(this, args)
    } as AnyFunction

    const debounced = debounceUtil(fn, waitMs, options)

    return function (this: unknown, ...args: Parameters<T>) {
      return (debounced as AnyFunction).apply(this, args)
    } as AnyFunction as T
  }
}

export function Debounce(waitMs: number, options?: DebounceOptions): MethodDecorator {
  let debouncedFn: Function | null = null
  return intercept({
    intercept: (execute, args) => {
      if (!debouncedFn) {
        debouncedFn = debounceUtil((...a: any[]) => execute(...a), waitMs, options)
      }
      return debouncedFn(...args)
    },
  }) as MethodDecorator
}
