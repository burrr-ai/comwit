import { ThrottleOptions, throttle as throttleUtil } from '../utils'
import { AnyFunction, createDecorator, Interceptor } from './utils'

export function throttle<T extends AnyFunction>(waitMs: number, options?: ThrottleOptions): Interceptor {
    return next => {
        const fn = ((...args: Parameters<T>) => {
            void next(...args)
        }) as AnyFunction

        const throttled = throttleUtil(fn, waitMs, options)

        return ((...args: Parameters<T>) => {
            return throttled(...args)
        }) as AnyFunction as T
    }
}

export function Throttle(waitMs: number, options?: ThrottleOptions): MethodDecorator {
    return createDecorator(throttle(waitMs, options))
}

