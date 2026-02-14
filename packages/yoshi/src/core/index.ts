import { useSyncExternalStore } from 'react'
import { model, Model } from './model'
import { action, ActionFactory } from './action'
import { StateProvider, useStoreRegistry } from './provider'

function create<S, A>(
    m: Model<S>,
    options: { actions: ActionFactory<Partial<A>>[] }
) {
    function useStore(): S & { actions: A }
    function useStore<R>(selector: (state: S & { actions: A }) => R): R
    function useStore<R>(selector?: (state: S & { actions: A }) => R) {
        const registry = useStoreRegistry()
        const store = registry.get(m)

        const inject = <T,>(dep: Model<T>): T => {
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

        const actions = Object.assign(
            {},
            ...options.actions.map(factory => factory(inject))
        ) as A

        const getSnapshot = () => store.snapshot
        const subscribe = (listener: () => void) => {
            store.listeners.add(listener)
            return () => store.listeners.delete(listener)
        }

        const snapshot = useSyncExternalStore(subscribe, getSnapshot)
        const full = { ...snapshot, actions } as S & { actions: A }

        if (selector) return selector(full)
        return full
    }

    return useStore
}

export {
    model,
    action,
    create,
    StateProvider,
}
