import { ThrottleOptions, throttle as throttleUtil } from '../utils'
import { AnyFunction, Interceptor, intercept } from './utils'

/**
 * Higher-order function that wraps a function with throttle behavior.
 * Ensures the function is called at most once per `waitMs` milliseconds.
 * The first call executes immediately, and subsequent calls within the
 * throttle window are deferred until the window elapses.
 *
 * @param waitMs - The throttle interval in milliseconds.
 * @param options - Optional throttle configuration (e.g. leading/trailing edge).
 * @returns An interceptor that applies throttle behavior.
 *
 * @example
 * ```ts
 * import { throttle } from 'comwit'
 *
 * const throttledScroll = throttle(200)(handleScroll)
 * window.addEventListener('scroll', throttledScroll)
 * ```
 */
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

/**
 * Method decorator that throttles the decorated method. Ensures the method is
 * called at most once per `waitMs` milliseconds. The first call executes
 * immediately, and subsequent calls within the throttle window are deferred
 * until the window elapses.
 *
 * @param waitMs - The throttle interval in milliseconds.
 * @param options - Optional throttle configuration (e.g. leading/trailing edge).
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class UiController {
 *   @Throttle(200)
 *   onScroll(event: Event) {
 *     this.updateScrollPosition(event)
 *   }
 * }
 * ```
 */
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
