import type { BoundResourceState } from './query'
import { bindResourceState } from './query'
import { useRef } from 'react'
import { getLazyInterceptorFactories, type LazyInterceptorFactory } from '../interceptors/utils'
import { useStoreRegistry } from './provider'

export type State = <T extends object>(model: Model<T>) => BoundResourceState<T>

export type ActionContext<TContext extends object = Record<string, never>> = {
  state: State
  context: TContext
}

export type ActionFactory<A, TContext extends object = Record<string, never>> = (
  ctx: ActionContext<TContext>
) => A

export function action<A, C extends object = Record<string, never>>(
  factory: ActionFactory<A, C>
): ActionFactory<A, C> {
  return (ctx) => {
    const instance = factory(ctx)
    return normalizeActions(instance as ActionModule, ctx) as A
  }
}

export function useAction<A, C extends object = Record<string, never>>(
  factories: ActionFactory<Partial<A>, C>[]
): A {
  const registry = useStoreRegistry()
  const actionsRef = useRef<A | null>(null)
  const resourceStateRef = useRef<Map<symbol, object>>(new Map())

  if (!actionsRef.current) {
    const state = <T extends object>(dep: Model<T>): BoundResourceState<T> => {
      const existing = resourceStateRef.current.get(dep.key)
      if (existing) return existing as BoundResourceState<T>

      const entry = registry.get(dep)
      if (!dep.resources.size) {
        resourceStateRef.current.set(dep.key, entry.proxy)
        return entry.proxy as BoundResourceState<T>
      }

      const bound = bindResourceState(
        entry.proxy,
        dep.resources,
        registry.queryDefaults,
        registry.queryBinding
      )
      resourceStateRef.current.set(dep.key, bound)
      return bound as BoundResourceState<T>
    }

    const context = (registry.context ?? {}) as C
    const merged = Object.assign(
      {},
      ...factories.map((factory) => factory({ state, context }) as A)
    ) as A

    actionsRef.current = registry.globalInterceptors?.length
      ? (applyGlobalInterceptors(merged as ActionModule, registry.globalInterceptors) as A)
      : merged
  }

  return actionsRef.current
}

type ActionModule = Record<string, unknown>
type AnyFunction = (...args: unknown[]) => unknown

function normalizeActions<A, C extends object = Record<string, never>>(
  module: A,
  ctx: ActionContext<C>
): ActionModule {
  if (!module || typeof module !== 'object') return {}

  const out: ActionModule = {}
  const instance = module as Record<string, unknown>

  for (const key of Object.getOwnPropertyNames(instance)) {
    const value = instance[key]
    if (typeof value !== 'function') {
      out[key] = value
      continue
    }

    out[key] = bindValue(value as AnyFunction, instance, ctx)
  }

  for (
    let proto = Object.getPrototypeOf(instance);
    proto && proto !== Object.prototype;
    proto = Object.getPrototypeOf(proto)
  ) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue
      const descriptor = Object.getOwnPropertyDescriptor(proto, key)
      const fn = descriptor?.value

      if (typeof fn !== 'function') continue
      out[key] = bindValue(fn as AnyFunction, instance, ctx)
    }
  }

  return out
}

function bindValue<C extends object>(
  fn: AnyFunction,
  instance: object,
  ctx: ActionContext<C>
): AnyFunction {
  return resolveLazyInterceptors(fn, ctx).bind(instance)
}

function resolveLazyInterceptors<C extends object = Record<string, never>>(
  fn: AnyFunction,
  ctx: ActionContext<C>
): AnyFunction {
  const factories = getLazyInterceptorFactories(fn) as Array<LazyInterceptorFactory<C>>
  if (!factories.length) return fn

  let next = fn
  for (const factory of factories) {
    const decorator = factory({ state: ctx.state, context: ctx.context })
    if (typeof decorator !== 'function') continue
    const descriptor: TypedPropertyDescriptor<AnyFunction> = {
      configurable: true,
      enumerable: true,
      writable: true,
      value: next,
    }

    decorator({}, '__mucha-action', descriptor)
    next = descriptor.value as AnyFunction
  }

  return next
}

function applyGlobalInterceptors(
  module: ActionModule,
  interceptors: MethodDecorator[]
): ActionModule {
  const out: ActionModule = {}
  for (const key of Object.keys(module)) {
    const value = module[key]
    if (typeof value !== 'function') {
      out[key] = value
      continue
    }
    let fn = value as AnyFunction
    for (const decorator of interceptors) {
      const descriptor: TypedPropertyDescriptor<AnyFunction> = {
        configurable: true,
        enumerable: true,
        writable: true,
        value: fn,
      }
      decorator({}, '__global-interceptor' as any, descriptor as any)
      fn = descriptor.value as AnyFunction
    }
    out[key] = fn
  }
  return out
}

type Model<T extends object> = import('./model').Model<T>
