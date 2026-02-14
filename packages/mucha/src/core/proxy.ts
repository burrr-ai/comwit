import {
    proxy as createReactiveProxy,
    snapshot as getReactiveSnapshot,
    subscribe as subscribeReactive,
} from 'valtio'

export function createProxy<T extends object>(initialValue: T): T {
    return createReactiveProxy(initialValue)
}

export function snapshot<T extends object>(state: T): T {
    return getReactiveSnapshot(state) as T
}

export function subscribe<T extends object>(state: T, listener: () => void): () => void {
    return subscribeReactive(state, listener)
}
