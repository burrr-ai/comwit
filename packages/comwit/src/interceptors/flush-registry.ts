import {
  debounce as debounceUtil,
  throttle as throttleUtil,
  type DebounceOptions,
  type ThrottleOptions,
} from '../utils'

/**
 * Internal handle types and registries that back `@Debounce` / `@Throttle`'s
 * flush / cancel helpers.
 *
 * Why a custom handle on top of es-toolkit?
 *
 * es-toolkit's `DebouncedFunction` / `ThrottledFunction` are typed as
 * `(...args) => void` — they intentionally drop both the wrapped function's
 * return value and any rejection it produces. That's fine for fire-and-forget
 * scheduling, but it breaks `@OnError @Debounce` composition: the `@OnError`
 * wrapper sits OUTSIDE `@Debounce` in the decorator stack, so it only sees the
 * (Promise) value that the `@Debounce` interceptor returns to it. Without a
 * deferred we'd hand `@OnError` an undefined and it would never see the
 * eventual rejection.
 *
 * The handle below adds exactly that piece: we let es-toolkit own the timing
 * (so leading/trailing edges, abort signals, etc. continue to behave
 * identically), but we route the inner invocation through a deferred Promise
 * we control. All callers within a single burst share the deferred — once
 * the burst's trailing edge fires (or is flushed), the deferred resolves
 * with the method's return value (or rejects with its error).
 */

type Deferred<T> = {
  promise: Promise<T>
  resolve: (v: T | PromiseLike<T>) => void
  reject: (e: unknown) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve']
  let reject!: Deferred<T>['reject']
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

type Execute = (thisArg: unknown, args: unknown[]) => unknown

export type FlushHandle = {
  /** Schedule (or extend the trailing edge of) the wrapped invocation. */
  invoke(thisArg: unknown, args: unknown[]): Promise<unknown>
  /** Immediately fire any pending trailing call. Resolves the burst's deferred. */
  flush(): Promise<unknown>
  /** Drop any pending trailing call. Resolves the burst's deferred with `undefined`. */
  cancel(): void
}

/**
 * Build a debounce-backed handle.
 *
 * Behavior matches es-toolkit's `debounce` exactly for timing — we just route
 * the inner invocation through a per-burst deferred so the return value /
 * rejection can flow back to whoever awaits `invoke(...)` or `flush()`.
 */
export function createDebounceHandle(
  execute: Execute,
  waitMs: number,
  options?: DebounceOptions
): FlushHandle {
  let pending: Deferred<unknown> | null = null

  // The inner that es-toolkit's debounce schedules. It captures the
  // burst-local deferred (passed as part of `args`) so that even if multiple
  // bursts pile up, each fires with the right deferred.
  const runner = debounceUtil(
    function (
      this: unknown,
      payload: { thisArg: unknown; args: unknown[]; deferred: Deferred<unknown> }
    ) {
      // This burst has fired — clear the shared pointer BEFORE invoking so
      // any synchronous re-entrant call (e.g. from the body of `execute`) is
      // treated as a brand-new burst.
      if (pending === payload.deferred) pending = null
      try {
        const r = execute(payload.thisArg, payload.args)
        Promise.resolve(r).then(payload.deferred.resolve, payload.deferred.reject)
      } catch (e) {
        payload.deferred.reject(e)
      }
    },
    waitMs,
    options
  )

  return {
    invoke(thisArg, args) {
      if (!pending) pending = createDeferred<unknown>()
      const deferred = pending
      runner({ thisArg, args, deferred })
      return deferred.promise
    },
    flush() {
      const d = pending
      runner.flush()
      // After flush, `runner` invokes our inner synchronously which resets
      // `pending` to null and resolves the deferred. If there was nothing
      // pending, return a resolved promise to keep the contract uniform.
      return d ? d.promise : Promise.resolve(undefined)
    },
    cancel() {
      const d = pending
      runner.cancel()
      pending = null
      if (d) d.resolve(undefined)
    },
  }
}

/**
 * Build a throttle-backed handle. Same shape as the debounce one — see
 * `createDebounceHandle` for the rationale on the deferred.
 */
export function createThrottleHandle(
  execute: Execute,
  waitMs: number,
  options?: ThrottleOptions
): FlushHandle {
  let pending: Deferred<unknown> | null = null

  const runner = throttleUtil(
    function (
      this: unknown,
      payload: { thisArg: unknown; args: unknown[]; deferred: Deferred<unknown> }
    ) {
      if (pending === payload.deferred) pending = null
      try {
        const r = execute(payload.thisArg, payload.args)
        Promise.resolve(r).then(payload.deferred.resolve, payload.deferred.reject)
      } catch (e) {
        payload.deferred.reject(e)
      }
    },
    waitMs,
    options
  )

  return {
    invoke(thisArg, args) {
      if (!pending) pending = createDeferred<unknown>()
      const deferred = pending
      runner({ thisArg, args, deferred })
      return deferred.promise
    },
    flush() {
      const d = pending
      runner.flush()
      return d ? d.promise : Promise.resolve(undefined)
    },
    cancel() {
      const d = pending
      runner.cancel()
      pending = null
      if (d) d.resolve(undefined)
    },
  }
}

/**
 * Per-instance map of methodName → debounce handle.
 */
export const debounceRegistry = new WeakMap<object, Map<string, FlushHandle>>()

/**
 * Per-instance map of methodName → throttle handle.
 */
export const throttleRegistry = new WeakMap<object, Map<string, FlushHandle>>()

/**
 * Symbol attached to bound action methods (the ones produced by
 * `normalizeActions` inside `action(...)`) so the helpers can resolve the
 * underlying class instance even when the user passes the merged actions
 * object returned from `useAction`.
 */
export const ACTION_OWNER = Symbol.for('comwit.actionOwner')

export type ActionOwnerLink = {
  instance: object
  methodName: string
}

export function attachActionOwner(fn: Function, instance: object, methodName: string): void {
  ;(fn as Function & { [ACTION_OWNER]?: ActionOwnerLink })[ACTION_OWNER] = {
    instance,
    methodName,
  }
}

/**
 * Resolve `(target, methodName)` to the underlying registered instance.
 *
 * Lookup order:
 * 1. `target` itself, when the user already holds a class instance.
 * 2. `target[methodName]`'s ACTION_OWNER pointer, set by `normalizeActions`
 *    when binding methods produced by `action(...)`.
 *
 * Returns `undefined` if no instance has registered a handle for this name.
 */
export function resolveOwner(
  registry: WeakMap<object, Map<string, FlushHandle>>,
  target: object,
  methodName: string
): { instance: object; methodName: string } | undefined {
  if (registry.has(target) && registry.get(target)!.has(methodName)) {
    return { instance: target, methodName }
  }

  const candidate = (target as Record<string, unknown>)[methodName]
  if (typeof candidate === 'function') {
    const link = (candidate as Function & { [ACTION_OWNER]?: ActionOwnerLink })[ACTION_OWNER]
    if (link && registry.has(link.instance) && registry.get(link.instance)!.has(link.methodName)) {
      return link
    }
  }

  return undefined
}

/**
 * Register or reuse the per-(instance, methodName) handle. Used by the
 * `@Debounce` / `@Throttle` decorators on first invocation.
 */
export function registerHandle(
  registry: WeakMap<object, Map<string, FlushHandle>>,
  instance: object,
  methodName: string,
  factory: () => FlushHandle
): FlushHandle {
  let perInstance = registry.get(instance)
  if (!perInstance) {
    perInstance = new Map()
    registry.set(instance, perInstance)
  }
  const existing = perInstance.get(methodName)
  if (existing) return existing
  const created = factory()
  perInstance.set(methodName, created)
  return created
}

/**
 * Resolve the registered handle for `(target, methodName)`, if any.
 */
export function getHandle(
  registry: WeakMap<object, Map<string, FlushHandle>>,
  target: object,
  methodName: string
): FlushHandle | undefined {
  const owner = resolveOwner(registry, target, methodName)
  if (!owner) return undefined
  return registry.get(owner.instance)?.get(owner.methodName)
}
