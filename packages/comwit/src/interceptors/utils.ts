import type { BoundResourceState } from '../core/query'
import type { Model } from '../core/model'

export type AnyFunction = (...args: any[]) => any

export type Interceptor<T extends AnyFunction = AnyFunction> = (next: T) => T

type ActionState = <T extends object>(model: Model<T>) => BoundResourceState<T>

export type ActionContext<TContext extends object = Record<string, never>> = {
  state: ActionState
  context: TContext
}

export type LazyInterceptorFactory<TContext extends object = Record<string, never>> = (
  ctx: ActionContext<TContext>
) => MethodDecorator

const LAZY_INTERCEPTORS = Symbol('mucha.lazyInterceptors')

type LazyInterceptorHost = {
  [LAZY_INTERCEPTORS]?: LazyInterceptorFactory[]
}

type UnscopedLazyInterceptorFactory = LazyInterceptorFactory<Record<string, never>>

function cloneLazyInterceptors<T extends AnyFunction>(source: unknown, target: T): T {
  const factories = getLazyInterceptorFactories(source)
  if (!factories.length) return target
  return Object.defineProperty(target, LAZY_INTERCEPTORS, {
    value: [...factories],
    configurable: true,
    enumerable: false,
    writable: false,
  }) as T
}

export function isThenable<T>(value: unknown): value is PromiseLike<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as PromiseLike<T>).then === 'function'
  )
}

export function composeInterceptors<T extends AnyFunction>(
  interceptors: Interceptor<T>[]
): Interceptor<T> {
  return (next) => interceptors.reduceRight((acc, interceptor) => interceptor(acc), next)
}

export function getLazyInterceptorFactories(target: unknown): LazyInterceptorFactory[] {
  if (!target || typeof target !== 'function') return []

  const factories = (target as LazyInterceptorHost)[LAZY_INTERCEPTORS]
  return Array.isArray(factories) ? factories : []
}

export type InterceptorHooks = {
  onBefore?: (...args: any[]) => void
  onSuccess?: (result: any, ...args: any[]) => void
  onError?: (error: unknown, ...args: any[]) => void
  onSettled?: (...args: any[]) => void
  intercept?: (execute: (...args: any[]) => any, args: any[]) => any
}

function applyToMethod(hooks: InterceptorHooks, descriptor: TypedPropertyDescriptor<any>): void {
  if (!descriptor || typeof descriptor.value !== 'function') return

  const original = descriptor.value

  descriptor.value = cloneLazyInterceptors(original, function (this: any, ...args: any[]) {
    const { onBefore, onSuccess, onError, onSettled, intercept: interceptHook } = hooks

    if (onBefore) onBefore(...args)

    let result: any
    try {
      if (interceptHook) {
        result = interceptHook((...a: any[]) => original.apply(this, a), args)
      } else {
        result = original.apply(this, args)
      }
    } catch (err) {
      if (onError) onError(err, ...args)
      if (onSettled) onSettled(...args)
      throw err
    }

    if (isThenable(result)) {
      return result.then(
        (resolved: any) => {
          if (onSuccess) onSuccess(resolved, ...args)
          if (onSettled) onSettled(...args)
          return resolved
        },
        (err: unknown) => {
          if (onError) onError(err, ...args)
          if (onSettled) onSettled(...args)
          throw err
        }
      )
    }

    if (onSuccess) onSuccess(result, ...args)
    if (onSettled) onSettled(...args)
    return result
  })
}

/**
 * Creates a method or class decorator that intercepts method execution with
 * lifecycle hooks.
 *
 * `intercept` supports two calling conventions:
 *
 * **Immediate mode** -- pass an `InterceptorHooks` object directly. The hooks
 * are applied at decoration time and execute on every method call.
 *
 * **Lazy mode** -- pass a factory function that receives an `ActionContext` and
 * returns `InterceptorHooks`. The factory is stored on the decorated method and
 * resolved later when the action is bound to a context (e.g. inside
 * `useAction`). This is useful when hooks need access to runtime state or
 * configuration that is not available at class-definition time.
 *
 * ### Hook lifecycle
 *
 * ```
 * onBefore(...args)
 *   |
 *   v
 * intercept(execute, args)   // or execute(...args) if no intercept hook
 *   |
 *   +---> onSuccess(result, ...args)   // on success
 *   |
 *   +---> onError(error, ...args)      // on error (error is re-thrown)
 *   |
 *   v
 * onSettled(...args)                   // always called (finally semantics)
 * ```
 *
 * ### Examples
 *
 * Immediate usage -- log every method call:
 * ```ts
 * const Log = intercept({
 *   onBefore: (...args) => console.log('call', args),
 *   onSuccess: (result) => console.log('ok', result),
 *   onError: (err) => console.error('fail', err),
 * })
 *
 * class Api {
 *   @Log
 *   fetchUser(id: string) { ... }
 * }
 * ```
 *
 * Lazy usage -- access runtime context:
 * ```ts
 * const WithAuth = intercept((ctx) => ({
 *   intercept: (execute, args) => {
 *     const { token } = ctx.context
 *     if (!token) throw new Error('unauthorized')
 *     return execute(...args)
 *   },
 * }))
 * ```
 *
 * Creating decorators with arguments:
 * ```ts
 * function Retry(times: number) {
 *   return intercept({
 *     intercept: async (execute, args) => {
 *       for (let i = 0; i < times; i++) {
 *         try { return await execute(...args) }
 *         catch (e) { if (i === times - 1) throw e }
 *       }
 *     },
 *   })
 * }
 * ```
 *
 * Class-level usage -- applies to all methods on the prototype:
 * ```ts
 * @intercept({ onBefore: () => console.log('any method called') })
 * class Actions {
 *   doA() { ... }
 *   doB() { ... }
 * }
 * ```
 *
 * @param hooksOrFactory - Either an `InterceptorHooks` object for immediate
 *   application, or a factory function `(ctx: ActionContext) => InterceptorHooks`
 *   for deferred (lazy) resolution.
 * @returns A decorator that can be applied to a method or a class.
 */
export function intercept(hooks: InterceptorHooks): MethodDecorator & ClassDecorator
export function intercept<TContext extends object = Record<string, never>>(
  factory: (ctx: ActionContext<TContext>) => InterceptorHooks
): MethodDecorator & ClassDecorator
export function intercept(
  hooksOrFactory: InterceptorHooks | ((ctx: ActionContext<any>) => InterceptorHooks)
): MethodDecorator & ClassDecorator {
  if (typeof hooksOrFactory === 'function') {
    // Lazy path: store a factory that resolves hooks when ActionContext is available.
    const lazyFactory: LazyInterceptorFactory = (ctx: ActionContext<any>) => {
      const hooks = hooksOrFactory(ctx)
      return intercept(hooks) as MethodDecorator
    }

    return ((
      target: any,
      propertyKey?: string | symbol,
      descriptor?: TypedPropertyDescriptor<any>
    ): any => {
      if (propertyKey === undefined || propertyKey === null) {
        // Class decorator: store factory on every method
        const constructor = target as Function
        const proto = constructor.prototype
        const keys = Object.getOwnPropertyNames(proto).filter((k) => k !== 'constructor')
        for (const key of keys) {
          const desc = Object.getOwnPropertyDescriptor(proto, key)
          if (desc && typeof desc.value === 'function') {
            const fn = desc.value as LazyInterceptorHost
            fn[LAZY_INTERCEPTORS] = [
              ...(getLazyInterceptorFactories(fn) as UnscopedLazyInterceptorFactory[]),
              lazyFactory as UnscopedLazyInterceptorFactory,
            ]
            Object.defineProperty(proto, key, desc)
          }
        }
        return constructor
      } else {
        // Method decorator: store factory on the method
        if (!descriptor || typeof descriptor.value !== 'function') return
        const fn = descriptor.value as LazyInterceptorHost
        fn[LAZY_INTERCEPTORS] = [
          ...(getLazyInterceptorFactories(fn) as UnscopedLazyInterceptorFactory[]),
          lazyFactory as UnscopedLazyInterceptorFactory,
        ]
      }
    }) as MethodDecorator & ClassDecorator
  }

  // Immediate path: apply hooks directly via applyToMethod.
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any {
    if (propertyKey === undefined || propertyKey === null) {
      // Class decorator
      const constructor = target as Function
      const proto = constructor.prototype
      const keys = Object.getOwnPropertyNames(proto).filter((k) => k !== 'constructor')
      for (const key of keys) {
        const desc = Object.getOwnPropertyDescriptor(proto, key)
        if (desc && typeof desc.value === 'function') {
          applyToMethod(hooksOrFactory as InterceptorHooks, desc)
          Object.defineProperty(proto, key, desc)
        }
      }
      return constructor
    } else {
      // Method decorator
      applyToMethod(hooksOrFactory as InterceptorHooks, descriptor!)
    }
  } as MethodDecorator & ClassDecorator
}
