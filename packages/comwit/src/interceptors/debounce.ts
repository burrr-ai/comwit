import { DebounceOptions, debounce as debounceUtil } from '../utils'
import { AnyFunction, Interceptor, intercept, type StageMethodDecorator } from './utils'
import { createDebounceHandle, debounceRegistry, getHandle, registerHandle } from './flush-registry'

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
 * The pending invocation can be flushed (executed immediately) or cancelled
 * (dropped) from outside via the {@link flushDebounce} / {@link cancelDebounce}
 * helpers — useful for shutdown or navigation flush scenarios where a
 * debounced autosave would otherwise be lost when the surrounding state is
 * torn down.
 *
 * Each `(instance, methodName)` pair has its own debounce timer, so two
 * instances of the same class do not share a debounce window.
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
 *
 * @example Flushing a pending call before navigation:
 * ```ts
 * import { Debounce, flushDebounce } from 'comwit'
 *
 * class DraftActions {
 *   @Debounce(700)
 *   async persistSoon() {
 *     await this.saveDraft()
 *   }
 * }
 *
 * // elsewhere — close handler / navigation
 * await flushDebounce(draftActions, 'persistSoon')
 * ```
 */
export function Debounce(waitMs: number, options?: DebounceOptions): StageMethodDecorator {
  return ((valueOrTarget: any, contextOrKey?: any, maybeDescriptor?: any) => {
    const methodName = extractMethodName(contextOrKey)
    const inner = intercept({
      intercept(execute: AnyFunction, args: any[]) {
        const instance = ((this as object) ?? GLOBAL_FALLBACK_OWNER) as object
        const handle = registerHandle(debounceRegistry, instance, methodName, () =>
          createDebounceHandle(
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
 * Immediately execute the trailing call pending behind a `@Debounce`-d method,
 * if any. Returns a Promise that resolves with the method's return value (or
 * `undefined` if there was no pending call).
 *
 * The returned Promise also rejects if the flushed method throws — so the
 * surrounding decorator stack (e.g. `@OnError`) sees the failure exactly as
 * if the call had fired on its own at the trailing edge.
 *
 * @param target - Either the action class instance or the merged actions
 *   object returned by `useAction(...)`. Both forms resolve to the same handle.
 * @param methodName - Name of the decorated method.
 *
 * @example
 * ```ts
 * import { flushDebounce } from 'comwit'
 *
 * await flushDebounce(draftActions, 'persistSoon')
 * ```
 */
export function flushDebounce<T extends object>(
  target: T,
  methodName: keyof T & string
): Promise<unknown> {
  const handle = getHandle(debounceRegistry, target as object, methodName)
  if (!handle) return Promise.resolve(undefined)
  return handle.flush()
}

/**
 * Drop any trailing call pending behind a `@Debounce`-d method. No-op when
 * nothing is pending. Resolves the in-flight invocation Promise (the one
 * returned from a previous call to the decorated method) with `undefined`.
 *
 * @param target - Either the action class instance or the merged actions
 *   object returned by `useAction(...)`.
 * @param methodName - Name of the decorated method.
 *
 * @example
 * ```ts
 * import { cancelDebounce } from 'comwit'
 *
 * cancelDebounce(draftActions, 'persistSoon')
 * ```
 */
export function cancelDebounce<T extends object>(target: T, methodName: keyof T & string): void {
  const handle = getHandle(debounceRegistry, target as object, methodName)
  if (!handle) return
  handle.cancel()
}

/**
 * Extract a method name from a stage 3 decorator context (`{ kind, name }`)
 * or a legacy `propertyKey` argument. Falls back to a sentinel when neither
 * convention applies (e.g. when `Debounce` is used as a plain wrapper).
 */
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

/**
 * Owner used when `@Debounce` ends up running with `this === undefined` — for
 * example a function pulled off a prototype and called without binding. We
 * keep a single sentinel so multiple anonymous calls on the same method still
 * share a debounce window (matching previous behavior).
 */
const GLOBAL_FALLBACK_OWNER: object = Object.freeze({})
