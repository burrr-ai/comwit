import { AnyFunction, isThenable, intercept } from './utils'

/**
 * Higher-order function that wraps a function to intercept successful results.
 * Calls the provided handler with the return value (or resolved value for async
 * functions) after the wrapped function completes successfully.
 *
 * @param handler - Called with the successful result. The original return value
 *   is preserved and passed through.
 * @returns A function wrapper that intercepts successful results.
 *
 * @example
 * ```ts
 * import { onSuccess } from 'comwit'
 *
 * const withLogging = onSuccess((result) => console.log('Result:', result))
 * const loggedFetch = withLogging(fetchUser)
 * ```
 */
export function onSuccess<T extends AnyFunction>(
  handler: (result: Awaited<ReturnType<T>>) => void
): (next: T) => T {
  return ((next: T) =>
    function (this: unknown, ...args: Parameters<T>) {
      const result = (next as AnyFunction).apply(this, args)
      if (!isThenable(result)) {
        handler(result as Awaited<ReturnType<T>>)
        return result
      }

      return Promise.resolve(result).then((value: unknown) => {
        handler(value as Awaited<ReturnType<T>>)
        return value
      }) as Awaited<ReturnType<T>>
    } as any) as any
}

/**
 * Method decorator that intercepts successful results of the decorated method.
 * Calls the provided handler with the return value (or resolved value for async
 * methods) after the method completes successfully. The original return value is
 * preserved.
 *
 * @param handler - Called with the successful result.
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class Api {
 *   @OnSuccess((user) => cache.set(user.id, user))
 *   async fetchUser(id: string) {
 *     const res = await fetch(`/api/users/${id}`)
 *     return res.json()
 *   }
 * }
 * ```
 */
export function OnSuccess<R>(handler: (result: R) => void): MethodDecorator {
  return intercept({ onSuccess: (result) => handler(result) }) as MethodDecorator
}
