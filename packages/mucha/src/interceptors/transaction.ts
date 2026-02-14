import { createDecorator, Interceptor } from './utils'

export function transaction(): <T extends (...args: any[]) => any>(next: T) => T {
    return next => {
        // TODO(option-3): implement automatic model tracking rollback
        // - Capture snapshots for all models touched during invocation
        // - On error, restore snapshots and rethrow
        return next
    }
}

export function Transaction(): MethodDecorator {
    return createDecorator(transaction())
}
