import { useRef, useSyncExternalStore, useCallback } from 'react'
import { model, Model } from './model'
import { action, ActionFactory } from './action'
import { MuchaProvider, useStoreRegistry } from './provider'
import { silent } from './silent'
import {
    bindResourceState,
    BoundResourceState,
    keepPreviousData,
    PlaceholderData,
    Resource,
    ResourceDefaultOptions,
    ResourceQueryOptions,
    query,
} from './query'
import { isEqual } from '../utils'

type ActionModule = Record<string, unknown>

function normalizeActions(module: ActionModule): ActionModule {
    if (!module || typeof module !== 'object') return {}

    const out: ActionModule = {}

    for (const key of Object.getOwnPropertyNames(module)) {
        const value = module[key]
        if (typeof value === 'function') {
            out[key] = value.bind(module)
            continue
        }
        out[key] = value
    }

    for (let proto = Object.getPrototypeOf(module); proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key === 'constructor') continue
            const descriptor = Object.getOwnPropertyDescriptor(proto, key)
            const fn = descriptor?.value

            if (typeof fn !== 'function') continue
            out[key] = (fn as AnyFunction).bind(module)
        }
    }

    return out
}

type AnyFunction = (...args: unknown[]) => unknown

function create<S extends object, A>(
    m: Model<S>,
    options: { actions: ActionFactory<Partial<A>>[] }
) {
    function useStore(): S & { actions: A }
    function useStore<R>(selector: (state: S & { actions: A }) => R): R
    function useStore<R>(selector?: (state: S & { actions: A }) => R) {
        const registry = useStoreRegistry()
        const store = registry.get(m)

        const actionsRef = useRef<A | null>(null)
        const resourceStateRef = useRef<Map<symbol, object>>(new Map())
        if (!actionsRef.current) {
            const inject = <T extends object>(dep: Model<T>): BoundResourceState<T> => {
                const existing = resourceStateRef.current.get(dep.key)
                if (existing) return existing as BoundResourceState<T>

                const entry = registry.get(dep)
                if (!entry.model.resources.size) {
                    resourceStateRef.current.set(dep.key, entry.proxy)
                    return entry.proxy as BoundResourceState<T>
                }

                const bound = bindResourceState(entry.proxy, entry.model.resources, registry.queryDefaults)
                resourceStateRef.current.set(dep.key, bound)
                return bound as BoundResourceState<T>
            }

            actionsRef.current = Object.assign({}, ...options.actions.map(factory => normalizeActions(factory({ inject }) as ActionModule))) as A
        }

        const prevRef = useRef<unknown>(null)

        const subscribe = useCallback(
            (listener: () => void) => store.subscribe(listener),
            [store]
        )

        const getSnapshot = () => {
            const full = { ...store.getSnapshot(), actions: actionsRef.current } as S & { actions: A }
            const next = selector ? selector(full) : full

            if (prevRef.current !== null && isEqual(prevRef.current, next)) {
                return prevRef.current as R
            }

            prevRef.current = next
            return next as R
        }

        return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    }

    return useStore
}

export {
    model,
    action,
    create,
    silent,
    MuchaProvider,
    query,
    keepPreviousData,
}

export type {
    Resource,
    PlaceholderData,
    ResourceDefaultOptions,
    ResourceQueryOptions,
}
