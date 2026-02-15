import React, { createContext, useContext, useRef } from 'react'
import type { Model } from './model'
import { createProxy, snapshot, subscribe } from './proxy'
import { isSilent } from './silent'

export type StoreEntry<T extends object = any> = {
    model: Model<T>
    proxy: T
    getSnapshot(): T
    subscribe(listener: () => void): () => void
}

export type StoreRegistry = {
    get<T extends object>(model: Model<T>): StoreEntry<T>
}

const StateContext = createContext<StoreRegistry | null>(null)

export function useStoreRegistry(): StoreRegistry {
    const ctx = useContext(StateContext)
    if (!ctx) throw new Error('Wrap your app with <StateProvider>')
    return ctx
}

export function StateProvider({ children }: { children: React.ReactNode }) {
    const storesRef = useRef<Map<symbol, StoreEntry>>(new Map())

    const registryRef = useRef<StoreRegistry>({
        get<T extends object>(model: Model<T>): StoreEntry<T> {
            const existing = storesRef.current.get(model.key)
            if (existing) return existing as StoreEntry<T>

            const p = createProxy(model.instance())

            const entry: StoreEntry<T> = {
                model,
                proxy: p,
                getSnapshot() {
                    return snapshot(p) as T
                },
                subscribe(listener) {
                    return subscribe(p, () => {
                        if (!isSilent()) listener()
                    })
                },
            }

            storesRef.current.set(model.key, entry)
            return entry
        }
    })

    return (
        <StateContext.Provider value={registryRef.current}>
            {children}
        </StateContext.Provider>
    )
}
