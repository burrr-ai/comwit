import { ThrottleOptions, throttle as throttleUtil } from '../utils'
import { AnyFunction, Interceptor, intercept, type StageMethodDecorator } from './utils'
import { createThrottleHandle, getHandle, registerHandle, throttleRegistry } from './flush-registry'

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
 * The trailing call queued behind the throttle window can be flushed
 * (executed immediately) or cancelled (dropped) from outside via the
 * {@link flushThrottle} / {@link cancelThrottle} helpers.
 *
 * Each `(instance, methodName)` pair has its own throttle timer.
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
 *
 * @example Flushing a pending trailing call:
 * ```ts
 * import { Throttle, flushThrottle } from 'comwit'
 *
 * class ScrollActions {
 *   @Throttle(200)
 *   async sendAnalytics() {
 *     await this.api.track()
 *   }
 * }
 *
 * await flushThrottle(scrollActions, 'sendAnalytics')
 * ```
 */
export function Throttle(waitMs: number, options?: ThrottleOptions): StageMethodDecorator {
  return ((valueOrTarget: any, contextOrKey?: any, maybeDescriptor?: any) => {
    const methodName = extractMethodName(contextOrKey)
    const inner = intercept({
      intercept(execute: AnyFunction, args: any[]) {
        const instance = ((this as object) ?? GLOBAL_FALLBACK_OWNER) as object
        const handle = registerHandle(throttleRegistry, instance, methodName, () =>
          createThrottleHandle(
            (thisArg, callArgs) => (execute as AnyFunction).apply(thisArg, callArgs),
            waitMs,
            options
          )
        )
        return handle.invoke(this, args)
      },
    }) as unknown as StageMethodDecorator
    return inner(valueOrTarget, contextOrKey, maybeDescriptor)
  }) as StageMethodDecorator
}

/**
 * Immediately execute the trailing call pending behind a `@Throttle`-d method,
 * if any. Returns a Promise that resolves with the method's return value (or
 * `undefined` if there was no pending call). Rejects with the method's error
 * if the flushed call throws.
 */
export function flushThrottle<T extends object>(
  target: T,
  methodName: keyof T & string
): Promise<unknown> {
  const handle = getHandle(throttleRegistry, target as object, methodName)
  if (!handle) return Promise.resolve(undefined)
  return handle.flush()
}

/**
 * Drop any trailing call pending behind a `@Throttle`-d method. No-op when
 * nothing is pending.
 */
export function cancelThrottle<T extends object>(target: T, methodName: keyof T & string): void {
  const handle = getHandle(throttleRegistry, target as object, methodName)
  if (!handle) return
  handle.cancel()
}

function extractMethodName(contextOrKey: unknown): string {
  if (contextOrKey && typeof contextOrKey === 'object' && 'kind' in contextOrKey) {
    const ctx = contextOrKey as { name?: string | symbol }
    if (typeof ctx.name === 'string') return ctx.name
    if (typeof ctx.name === 'symbol') return ctx.name.description ?? '<symbol>'
  }
  if (typeof contextOrKey === 'string') return contextOrKey
  if (typeof contextOrKey === 'symbol') return contextOrKey.description ?? '<symbol>'
  return '<anonymous>'
}

const GLOBAL_FALLBACK_OWNER: object = Object.freeze({})
