import type { Model } from '../core/model'
import type { BoundResourceState } from '../core/query/types'

export type AnyFunction = (...args: any[]) => any

export type Interceptor<T extends AnyFunction = AnyFunction> = (next: T) => T

type ActionState = <T extends object>(model: Model<T>) => BoundResourceState<T>

export type ActionContext<TContext extends object = Record<string, never>> = {
  state: ActionState
  context: TContext
}

/**
 * Dual-mode method decorator type. Compatible with both legacy
 * (`experimentalDecorators`) and TC39 Stage 3 decorator calling conventions.
 */
export type StageMethodDecorator = (
  valueOrTarget: any,
  contextOrKey?: any,
  maybeDescriptor?: any
) => any

export type LazyInterceptorFactory<TContext extends object = Record<string, never>> = (
  ctx: ActionContext<TContext>
) => StageMethodDecorator

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

function wrapWithHooks(hooks: InterceptorHooks, original: Function): Function {
  return cloneLazyInterceptors(original, function (this: any, ...args: any[]) {
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
 * Detect whether the decorator is being called with Stage 3 (TC39) or legacy
 * (experimentalDecorators) convention.
 *
 * Stage 3: `(value: Function, context: { kind: 'method' | 'class', ... })`
 * Legacy:  `(target, propertyKey?, descriptor?)` where propertyKey is string|symbol or undefined
 */
function isStage3Context(arg: unknown): arg is ClassMethodDecoratorContext | ClassDecoratorContext {
  return arg !== null && typeof arg === 'object' && 'kind' in (arg as any)
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
export function intercept(hooks: InterceptorHooks): StageMethodDecorator
export function intercept<TContext extends object = Record<string, never>>(
  factory: (ctx: ActionContext<TContext>) => InterceptorHooks
): StageMethodDecorator
export function intercept(
  hooksOrFactory: InterceptorHooks | ((ctx: ActionContext<any>) => InterceptorHooks)
): StageMethodDecorator {
  if (typeof hooksOrFactory === 'function') {
    // Lazy path: store a factory that resolves hooks when ActionContext is available.
    const lazyFactory: LazyInterceptorFactory = (ctx: ActionContext<any>) => {
      const hooks = hooksOrFactory(ctx)
      return intercept(hooks) as unknown as StageMethodDecorator
    }

    return (
      valueOrTarget: any,
      contextOrKey?: any,
      maybeDescriptor?: TypedPropertyDescriptor<any>
    ): any => {
      if (isStage3Context(contextOrKey)) {
        // --- Stage 3 ---
        if (contextOrKey.kind === 'method') {
          storeLazyFactory(valueOrTarget, lazyFactory)
        } else if (contextOrKey.kind === 'class') {
          storeLazyFactoryOnPrototype(valueOrTarget, lazyFactory)
        }
        return
      }

      // --- Legacy ---
      if (contextOrKey === undefined || contextOrKey === null) {
        // Legacy class decorator
        storeLazyFactoryOnPrototype(valueOrTarget, lazyFactory)
        return valueOrTarget
      } else {
        // Legacy method decorator
        if (!maybeDescriptor || typeof maybeDescriptor.value !== 'function') return
        storeLazyFactory(maybeDescriptor.value, lazyFactory)
      }
    }
  }

  // Immediate path: apply hooks directly.
  return (
    valueOrTarget: any,
    contextOrKey?: any,
    maybeDescriptor?: TypedPropertyDescriptor<any>
  ): any => {
    const hooks = hooksOrFactory as InterceptorHooks

    if (isStage3Context(contextOrKey)) {
      // --- Stage 3 ---
      if (contextOrKey.kind === 'method') {
        return wrapWithHooks(hooks, valueOrTarget)
      } else if (contextOrKey.kind === 'class') {
        patchPrototypeMethods(valueOrTarget, hooks)
      }
      return
    }

    // --- Legacy ---
    if (contextOrKey === undefined || contextOrKey === null) {
      // Legacy class decorator
      patchPrototypeMethods(valueOrTarget, hooks)
      return valueOrTarget
    } else {
      // Legacy method decorator
      if (!maybeDescriptor || typeof maybeDescriptor.value !== 'function') return
      maybeDescriptor.value = wrapWithHooks(hooks, maybeDescriptor.value) as any
    }
  }
}

function storeLazyFactory(fn: Function, factory: LazyInterceptorFactory): void {
  const existing = getLazyInterceptorFactories(fn) as UnscopedLazyInterceptorFactory[]
  Object.defineProperty(fn, LAZY_INTERCEPTORS, {
    value: [...existing, factory as UnscopedLazyInterceptorFactory],
    configurable: true,
    enumerable: false,
    writable: true,
  })
}

function storeLazyFactoryOnPrototype(constructor: Function, factory: LazyInterceptorFactory): void {
  const proto = constructor.prototype
  const keys = Object.getOwnPropertyNames(proto).filter((k) => k !== 'constructor')
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(proto, key)
    if (desc && typeof desc.value === 'function') {
      storeLazyFactory(desc.value, factory)
    }
  }
}

function patchPrototypeMethods(constructor: Function, hooks: InterceptorHooks): void {
  const proto = constructor.prototype
  const keys = Object.getOwnPropertyNames(proto).filter((k) => k !== 'constructor')
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(proto, key)
    if (desc && typeof desc.value === 'function') {
      desc.value = wrapWithHooks(hooks, desc.value)
      Object.defineProperty(proto, key, desc)
    }
  }
}
