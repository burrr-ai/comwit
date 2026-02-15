import { AnyFunction, createDecorator, isThenable } from './utils'

export function onSuccess<T extends AnyFunction>(handler: (result: Awaited<ReturnType<T>>) => void): (next: T) => T {
    return ((next: T) => ((...args: Parameters<T>) => {
        const result = next(...args)
        if (!isThenable(result)) {
            handler(result as Awaited<ReturnType<T>>)
            return result
        }

        return Promise.resolve(result).then((value: unknown) => {
            handler(value as Awaited<ReturnType<T>>)
            return value
        }) as Awaited<ReturnType<T>>
    }) as any) as any
}

export function OnSuccess<R>(handler: (result: R) => void): MethodDecorator {
    return createDecorator(onSuccess(handler))
}
