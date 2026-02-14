import React, { createContext, useContext, useRef } from 'react'
import { proxy, snapshot as valtioSnapshot, subscribe as valtioSubscribe } from 'valtio'
import type { Model } from './model'

export type StoreEntry<T extends object = any> = {
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

            const p = proxy(model.instance())

            const entry: StoreEntry<T> = {
                proxy: p,
                getSnapshot() {
                    return valtioSnapshot(p) as T
                },
                subscribe(listener) {
                    return valtioSubscribe(p, listener)
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
