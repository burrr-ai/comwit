import { AnyFunction, Interceptor, intercept, type StageMethodDecorator } from './utils'

type QueueStrategy = 'drop' | 'queue' | 'replace'

/**
 * Higher-order function that wraps an async function with concurrency control.
 * Prevents concurrent execution using one of three strategies:
 *
 * - `'drop'` (default): Ignores new calls while a previous call is still running.
 * - `'queue'`: Chains calls sequentially so each waits for the previous to finish.
 * - `'replace'`: Allows new calls to proceed but discards the results of any
 *   stale (superseded) calls. Only the latest call's result is used.
 *
 * @param strategy - The concurrency strategy to use. Defaults to `'drop'`.
 * @returns An interceptor that applies concurrency control.
 *
 * @example
 * ```ts
 * import { queue } from 'comwit'
 *
 * const withQueue = queue('queue')
 * const sequentialSave = withQueue(saveData)
 * ```
 */
export function queue(strategy: QueueStrategy = 'drop'): Interceptor {
  return ((next: AnyFunction) => {
    let running: Promise<any> | null = null
    let callId = 0

    if (strategy === 'drop') {
      return function (this: unknown, ...args: any[]) {
        if (running) return running
        const result = Promise.resolve(next.apply(this, args))
        running = result.finally(() => {
          running = null
        })
        return running
      } as any
    }

    if (strategy === 'queue') {
      let chain: Promise<any> = Promise.resolve()
      return function (this: unknown, ...args: any[]) {
        chain = chain.then(() => next.apply(this, args))
        return chain
      } as any
    }

    // strategy === 'replace'
    return function (this: unknown, ...args: any[]) {
      const id = ++callId
      const result = Promise.resolve(next.apply(this, args))
      running = result
      return result.then((value) => {
        if (callId !== id) return undefined
        return value
      })
    } as any
  }) as any
}

/**
 * Method decorator that prevents concurrent execution of the decorated method.
 * Uses one of three strategies to handle overlapping calls:
 *
 * - `'drop'` (default): Ignores new calls while a previous call is still running.
 * - `'queue'`: Chains calls sequentially so each waits for the previous to finish.
 * - `'replace'`: Allows new calls to proceed but discards the results of any
 *   stale (superseded) calls. Only the latest call's result is used.
 *
 * @param strategy - The concurrency strategy to use. Defaults to `'drop'`.
 * @returns A method decorator.
 *
 * @example
 * ```ts
 * class Api {
 *   @Queue('drop')
 *   async save(data: Record<string, unknown>) {
 *     await fetch('/api/save', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     })
 *   }
 * }
 * ```
 */
export function Queue(strategy: QueueStrategy = 'drop'): StageMethodDecorator {
  let running: Promise<any> | null = null
  let callId = 0
  let chain: Promise<any> = Promise.resolve()

  return intercept({
    intercept: (execute, args) => {
      if (strategy === 'drop') {
        if (running) return running
        const result = Promise.resolve(execute(...args))
        running = result.finally(() => {
          running = null
        })
        return running
      }

      if (strategy === 'queue') {
        chain = chain.then(() => execute(...args))
        return chain
      }

      // strategy === 'replace'
      const id = ++callId
      const result = Promise.resolve(execute(...args))
      running = result
      return result.then((value) => {
        if (callId !== id) return undefined
        return value
      })
    },
  }) as unknown as StageMethodDecorator
}
