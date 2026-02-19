import { AnyFunction, isThenable, intercept } from './utils'

/**
 * Higher-order function that wraps a function to intercept errors.
 * Calls the provided handler with the caught error, then re-throws it.
 * Works with both synchronous throws and asynchronous rejections.
 *
 * @param handler - Called with the caught error. The error is always re-thrown
 *   after the handler runs.
 * @returns A function wrapper that intercepts errors.
 *
 * @example
 * ```ts
 * import { onError } from 'comwit'
 *
 * const withErrorLogging = onError((err) => console.error('Failed:', err))
 * const safeFetch = withErrorLogging(fetch)
 * ```
 */
export function onError<T extends AnyFunction>(handler: (error: unknown) => void): (next: T) => T {
  return ((next: T) =>
    function (this: unknown, ...args: Parameters<T>) {
      try {
        const result = (next as AnyFunction).apply(this, args)
        if (!isThenable(result)) return result
        return Promise.resolve(result).catch((error) => {
          handler(error)
          throw error
        })
      } catch (error) {
        handler(error)
        throw error
      }
    } as any) as any
}

/**
 * Method decorator that intercepts errors thrown by the decorated method.
 * Calls the provided handler with the caught error, then re-throws it.
 * Works with both synchronous throws and asynchronous rejections.
 *
 * @param handler - Called with the caught error. The error is always re-thrown
 *   after the handler runs.
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class Api {
 *   @OnError((err) => Sentry.captureException(err))
 *   async fetchUser(id: string) {
 *     return fetch(`/api/users/${id}`)
 *   }
 * }
 * ```
 */
export function OnError(handler: (error: unknown) => any): MethodDecorator {
  return intercept({ onError: (err) => handler(err) }) as MethodDecorator
}
