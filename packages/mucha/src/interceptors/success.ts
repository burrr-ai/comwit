import { AnyFunction, createDecorator, isThenable } from './utils'

export function onSuccess<T extends AnyFunction>(handler: (result: Awaited<ReturnType<T>>) => void): (next: T) => T {
    return (next => ((...args: Parameters<T>) => {
        const result = next(...args)
        if (!isThenable(result)) {
            handler(result as Awaited<ReturnType<T>>)
            return result
        }

        return Promise.resolve(result).then((value: Awaited<ReturnType<T>>) => {
            handler(value)
            return value
        })
    }) as any) as any
}

export function OnSuccess<R>(handler: (result: R) => void): MethodDecorator {
    return createDecorator(onSuccess(handler))
}
