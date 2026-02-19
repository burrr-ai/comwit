import { AnyFunction, Interceptor, intercept } from './utils'

type RetryOptions = { delay?: number; backoff?: 'fixed' | 'exponential' }

function resolveOptions(options?: number | RetryOptions): {
  delay: number
  backoff: 'fixed' | 'exponential'
} {
  if (typeof options === 'number') {
    return { delay: options, backoff: 'fixed' }
  }
  return {
    delay: options?.delay ?? 0,
    backoff: options?.backoff ?? 'fixed',
  }
}

function getDelay(baseDelay: number, attempt: number, backoff: 'fixed' | 'exponential'): number {
  if (backoff === 'exponential') {
    return baseDelay * Math.pow(2, attempt)
  }
  return baseDelay
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Higher-order function that wraps an async function with retry behavior.
 * On failure, waits the configured delay and retries up to `count` times.
 * If all attempts fail, the last error is thrown. Supports fixed and
 * exponential backoff strategies.
 *
 * @param count - Maximum number of retry attempts (not counting the initial call).
 * @param options - Retry delay in milliseconds, or an options object with
 *   `delay` and `backoff` settings.
 * @returns An interceptor that applies retry behavior.
 *
 * @example
 * ```ts
 * import { retry } from 'comwit'
 *
 * const withRetry = retry(3, { delay: 1000, backoff: 'exponential' })
 * const resilientFetch = withRetry(fetchData)
 * ```
 */
export function retry(count: number, options?: number | RetryOptions): Interceptor {
  const { delay, backoff } = resolveOptions(options)

  return ((next: AnyFunction) =>
    async function (this: unknown, ...args: any[]) {
      let lastError: unknown
      for (let attempt = 0; attempt <= count; attempt++) {
        try {
          return await next.apply(this, args)
        } catch (err) {
          lastError = err
          if (attempt < count) {
            const waitMs = getDelay(delay, attempt, backoff)
            if (waitMs > 0) {
              await sleep(waitMs)
            }
          }
        }
      }
      throw lastError
    } as any) as any
}

/**
 * Method decorator that retries failed async method calls. On failure, waits
 * the configured delay and retries up to `count` times. If all attempts fail,
 * the last error is thrown. Supports fixed and exponential backoff strategies.
 *
 * @param count - Maximum number of retry attempts (not counting the initial call).
 * @param options - Retry delay in milliseconds, or an options object with
 *   `delay` and `backoff` settings.
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class Api {
 *   @Retry(3, { delay: 1000, backoff: 'exponential' })
 *   async fetchUser(id: string) {
 *     const res = await fetch(`/api/users/${id}`)
 *     if (!res.ok) throw new Error('fetch failed')
 *     return res.json()
 *   }
 * }
 * ```
 */
export function Retry(count: number, options?: number | RetryOptions): MethodDecorator {
  const { delay, backoff } = resolveOptions(options)

  return intercept({
    intercept: async (execute, args) => {
      let lastError: unknown
      for (let attempt = 0; attempt <= count; attempt++) {
        try {
          return await execute(...args)
        } catch (err) {
          lastError = err
          if (attempt < count) {
            const waitMs = getDelay(delay, attempt, backoff)
            if (waitMs > 0) {
              await sleep(waitMs)
            }
          }
        }
      }
      throw lastError
    },
  }) as MethodDecorator
}
