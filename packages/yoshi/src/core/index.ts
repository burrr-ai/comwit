import { useRef, useSyncExternalStore, useCallback } from 'react'
import { model, Model } from './model'
import { action, ActionFactory } from './action'
import { StateProvider, useStoreRegistry } from './provider'
import { isEqual } from '../utils'

function create<S, A>(
    m: Model<S>,
    options: { actions: ActionFactory<Partial<A>>[] }
) {
    function useStore(): S & { actions: A }
    function useStore<R>(selector: (state: S & { actions: A }) => R): R
    function useStore<R>(selector?: (state: S & { actions: A }) => R) {
        const registry = useStoreRegistry()
        const store = registry.get(m)

        const state = <T,>(dep: Model<T>): T => {
            const depStore = registry.get(dep)
            return new Proxy(depStore.snapshot as object, {
                set(_, prop, value) {
                    depStore.mutate(draft => {
                        (draft as any)[prop] = value
                    })
                    return true
                },
                get(_, prop) {
                    return (depStore.snapshot as any)[prop]
                }
            }) as T
        }

        const actionsRef = useRef<A | null>(null)
        if (!actionsRef.current) {
            actionsRef.current = Object.assign(
                {},
                ...options.actions.map(factory => factory(state))
            ) as A
        }

        const prevRef = useRef<unknown>(null)

        const subscribe = useCallback((listener: () => void) => {
            store.listeners.add(listener)
            return () => store.listeners.delete(listener)
        }, [store])

        const getSnapshot = () => {
            const full = { ...store.snapshot, actions: actionsRef.current } as S & { actions: A }
            const next = selector ? selector(full) : full

            if (prevRef.current !== null && isEqual(prevRef.current, next)) {
                return prevRef.current as R
            }

            prevRef.current = next
            return next as R
        }

        return useSyncExternalStore(subscribe, getSnapshot)
    }

    return useStore
}

export {
    model,
    action,
    create,
    StateProvider,
}
