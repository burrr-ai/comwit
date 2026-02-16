import { useRef, useSyncExternalStore, useCallback } from 'react'
import { model, Model } from './model'
import { action, ActionFactory, createActionContext } from './action'
import { MuchaProvider, useStoreRegistry } from './provider'
import { silent } from './silent'
import {
    bindResourceState,
    BoundResourceState,
    keepPreviousData,
    PlaceholderData,
    Query,
    QueryDefaultOptions,
    QueryQueryOptions,
    query,
} from './query'
import { isEqual } from '../utils'

function create<S extends object, A>(
    m: Model<S>,
    options: { actions: ActionFactory<Partial<A>, any>[] }
) {
    function useStore(): S & { actions: A }
    function useStore<R>(selector: (state: S & { actions: A }) => R): R
    function useStore<R>(selector?: (state: S & { actions: A }) => R) {
        const registry = useStoreRegistry()
        const store = registry.get(m)

        const actionsRef = useRef<A | null>(null)
        const resourceStateRef = useRef<Map<symbol, object>>(new Map())
        if (!actionsRef.current) {
            const state = <T extends object>(dep: Model<T>): BoundResourceState<T> => {
                const existing = resourceStateRef.current.get(dep.key)
                if (existing) return existing as BoundResourceState<T>

                const entry = registry.get(dep)
                if (!entry.model.resources.size) {
                    resourceStateRef.current.set(dep.key, entry.proxy)
                    return entry.proxy as BoundResourceState<T>
                }

                const bound = bindResourceState(
                    entry.proxy,
                    entry.model.resources,
                    registry.queryDefaults,
                    registry.queryBinding,
                )
                resourceStateRef.current.set(dep.key, bound)
                return bound as BoundResourceState<T>
            }

            const context = registry.context ?? {}
            actionsRef.current = Object.assign(
                {},
                ...options.actions.map(factory => factory({ state, context }) as A),
            ) as A
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
    createActionContext,
    action,
    create,
    silent,
    MuchaProvider,
    query,
    keepPreviousData,
}

export type {
    Query,
    PlaceholderData,
    QueryDefaultOptions,
    QueryQueryOptions,
}
