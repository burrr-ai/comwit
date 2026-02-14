export type AnyFunction = (...args: any[]) => any

export type Interceptor<T extends AnyFunction = AnyFunction> = (next: T) => T

export function isThenable<T>(value: unknown): value is PromiseLike<T> {
    return value !== null && typeof value === 'object' && typeof (value as PromiseLike<T>).then === 'function'
}

export function composeInterceptors<T extends AnyFunction>(interceptors: Interceptor<T>[]): Interceptor<T> {
    return next => interceptors.reduceRight((acc, interceptor) => interceptor(acc), next)
}

export function createDecorator<T extends AnyFunction>(interceptor: Interceptor<T>): MethodDecorator {
    return (_target: object, _propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
        if (!descriptor || !descriptor.value) return
        descriptor.value = interceptor(descriptor.value)
    }
}
