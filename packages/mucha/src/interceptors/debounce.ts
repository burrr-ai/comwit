import { DebounceOptions, debounce as debounceUtil } from '../utils'
import { AnyFunction, createDecorator, Interceptor } from './utils'

export function debounce<T extends AnyFunction>(waitMs: number, options?: DebounceOptions): Interceptor {
    return next => {
        const fn = ((...args: Parameters<T>) => {
            void next(...args)
        }) as AnyFunction

        const debounced = debounceUtil(fn, waitMs, options)

        return ((...args: Parameters<T>) => {
            return debounced(...args)
        }) as AnyFunction as T
    }
}

export function Debounce(waitMs: number, options?: DebounceOptions): MethodDecorator {
    return createDecorator(debounce(waitMs, options))
}

