import { AnyFunction, createDecorator, isThenable } from './utils'

export function onError<T extends AnyFunction>(handler: (error: unknown) => void): (next: T) => T {
    return ((next: T) => ((...args: Parameters<T>) => {
        try {
            const result = next(...args)
            if (!isThenable(result)) return result
            return Promise.resolve(result).catch(error => handler(error))
        } catch (error) {
            handler(error)
            throw error
        }
    }) as any) as any
}

export function OnError(handler: (error: unknown) => any): MethodDecorator {
    return createDecorator(onError(handler))
}
