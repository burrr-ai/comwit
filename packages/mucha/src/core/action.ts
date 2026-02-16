import type { BoundResourceState } from './query'
import { getLazyInterceptorFactories, type LazyInterceptorFactory } from '../interceptors/utils'

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

export function createActionContext<TContext extends object>() {
  return {
    action<A>(factory: ActionFactory<A, TContext>): ActionFactory<A, TContext> {
      return action(factory)
    },
  } as const
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

type Model<T extends object> = import('./model').Model<T>
