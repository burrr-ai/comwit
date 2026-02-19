import { AnyFunction, Interceptor, intercept } from './utils'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Higher-order function that wraps a function with console logging.
 * Logs the function name and arguments on each call, the result on success,
 * and the error on failure using the specified console log level.
 *
 * @param level - The console method to use for logging. Defaults to `'info'`.
 * @returns An interceptor that logs method calls.
 *
 * @example
 * ```ts
 * import { log } from 'comwit'
 *
 * const withDebugLog = log('debug')
 * const loggedFetch = withDebugLog(fetchUser)
 * ```
 */
export function log(level: LogLevel = 'info'): Interceptor {
  return ((next: AnyFunction) => {
    const name = next.name || 'anonymous'
    return function (this: unknown, ...args: any[]) {
      const logger = console[level]
      logger(`[${name}] called with`, args)
      try {
        const result = next.apply(this, args)
        if (result && typeof result === 'object' && typeof result.then === 'function') {
          return result.then(
            (value: any) => {
              logger(`[${name}] resolved with`, value)
              return value
            },
            (err: unknown) => {
              logger(`[${name}] rejected with`, err)
              throw err
            }
          )
        }
        logger(`[${name}] returned`, result)
        return result
      } catch (err) {
        logger(`[${name}] threw`, err)
        throw err
      }
    } as any
  }) as any
}

/**
 * Method decorator that logs calls to the decorated method for debugging.
 * Logs the method name and arguments on each call, the result on success,
 * and the error on failure using the specified console log level.
 *
 * @param level - The console method to use for logging. Defaults to `'info'`.
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class Api {
 *   @Log('debug')
 *   async fetchUser(id: string) {
 *     const res = await fetch(`/api/users/${id}`)
 *     return res.json()
 *   }
 * }
 * ```
 */
export function Log(level: LogLevel = 'info'): MethodDecorator {
  return intercept({
    onBefore: (...args: any[]) => {
      console[level](`called with`, args)
    },
    onSuccess: (result: any, ...args: any[]) => {
      console[level](`returned`, result)
    },
    onError: (error: unknown, ...args: any[]) => {
      console[level](`threw`, error)
    },
  }) as MethodDecorator
}
