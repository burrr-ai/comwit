import { useRef, useSyncExternalStore, useCallback } from 'react'
import { model, Model } from './model'
import { action, ActionFactory } from './action'
import { StateProvider, useStoreRegistry } from './provider'
import { isEqual } from '../utils'

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
        if (!actionsRef.current) {
            const inject = <T extends object>(dep: Model<T>): T => {
                return registry.get(dep).proxy
            }

            actionsRef.current = Object.assign(
                {},
                ...options.actions.map(factory => factory(inject))
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
    action,
    create,
    StateProvider,
}
