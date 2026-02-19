import { DebounceOptions, debounce as debounceUtil } from '../utils'
import { AnyFunction, Interceptor, intercept } from './utils'

/**
 * Higher-order function that wraps a function with debounce behavior.
 * Delays invocation until `waitMs` milliseconds have elapsed since the last
 * call. Rapid successive calls reset the timer, so only the final call within
 * the wait window is executed.
 *
 * @param waitMs - The debounce delay in milliseconds.
 * @param options - Optional debounce configuration (e.g. leading/trailing edge).
 * @returns An interceptor that applies debounce behavior.
 *
 * @example
 * ```ts
 * import { debounce } from 'comwit'
 *
 * const debouncedSearch = debounce(300)(searchApi)
 * // Only the last call within 300ms will execute
 * debouncedSearch('react')
 * debouncedSearch('react hooks') // resets the timer
 * ```
 */
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

/**
 * Method decorator that debounces the decorated method. Delays invocation
 * until `waitMs` milliseconds have elapsed since the last call. Rapid
 * successive calls reset the timer, so only the final call within the wait
 * window is executed.
 *
 * @param waitMs - The debounce delay in milliseconds.
 * @param options - Optional debounce configuration (e.g. leading/trailing edge).
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class SearchController {
 *   @Debounce(300)
 *   onSearchInput(query: string) {
 *     this.fetchResults(query)
 *   }
 * }
 * ```
 */
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
