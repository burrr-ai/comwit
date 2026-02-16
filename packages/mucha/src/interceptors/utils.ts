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
    ctx: ActionContext<TContext>,
) => MethodDecorator

const LAZY_INTERCEPTORS = Symbol('mucha.lazyInterceptors')

type LazyInterceptorHost = {
    [LAZY_INTERCEPTORS]?: LazyInterceptorFactory[]
}

type UnscopedLazyInterceptorFactory = LazyInterceptorFactory<Record<string, never>>

function cloneLazyInterceptors<T extends AnyFunction>(source: unknown, target: T): T {
    const factories = getLazyInterceptorFactories(source)
    if (!factories.length) return target
    return Object.defineProperty(
        target,
        LAZY_INTERCEPTORS,
        {
            value: [...factories],
            configurable: true,
            enumerable: false,
            writable: false,
        },
    ) as T
}

export function isThenable<T>(value: unknown): value is PromiseLike<T> {
    return value !== null && typeof value === 'object' && typeof (value as PromiseLike<T>).then === 'function'
}

export function composeInterceptors<T extends AnyFunction>(interceptors: Interceptor<T>[]): Interceptor<T> {
    return next => interceptors.reduceRight((acc, interceptor) => interceptor(acc), next)
}

export function createInterceptor<TContext extends object = Record<string, never>>(
    factory: LazyInterceptorFactory<TContext>,
): MethodDecorator {
    return (_target: object, _propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
        if (!descriptor || typeof descriptor.value !== 'function') return
        const fn = descriptor.value as LazyInterceptorHost
        fn[LAZY_INTERCEPTORS] = [
            ...(getLazyInterceptorFactories(fn) as UnscopedLazyInterceptorFactory[]),
            factory as UnscopedLazyInterceptorFactory,
        ]
    }
}

export function getLazyInterceptorFactories(
    target: unknown,
): LazyInterceptorFactory[] {
    if (!target || typeof target !== 'function') return []

    const factories = (target as LazyInterceptorHost)[LAZY_INTERCEPTORS]
    return Array.isArray(factories) ? factories : []
}

export function createDecorator<T extends AnyFunction>(interceptor: Interceptor<T>): MethodDecorator {
    return (_target: object, _propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
        if (!descriptor || typeof descriptor.value !== 'function') return
        const next = cloneLazyInterceptors(
            descriptor.value,
            interceptor(descriptor.value as T),
        )
        descriptor.value = next
    }
}
