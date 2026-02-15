import React, { createContext, useContext, useRef } from 'react'
import { createProxy, snapshot, subscribe } from './proxy'
import type { ResourceDefaultOptions } from './query'
import type { Model } from './model'
import { isSilent } from './silent'

type StoreEntry<T extends object = any> = {
    model: Model<T>
    proxy: T
    getSnapshot(): T
    subscribe(listener: () => void): () => void
}

export type RegistryDefaults = {
    query?: ResourceDefaultOptions
}

export type MuchaProviderProps = {
    children: React.ReactNode
    defaultOptions?: RegistryDefaults
}

export type StoreRegistry = {
    get<T extends object>(model: Model<T>): StoreEntry<T>
    queryDefaults?: RegistryDefaults['query']
}

const StateContext = createContext<StoreRegistry | null>(null)

export function useStoreRegistry(): StoreRegistry {
    const ctx = useContext(StateContext)
    if (!ctx) throw new Error('Wrap your app with <MuchaProvider>')
    return ctx
}

export function MuchaProvider({ children, defaultOptions }: MuchaProviderProps) {
    const storesRef = useRef<Map<symbol, StoreEntry>>(new Map())

    const registryRef = useRef<StoreRegistry>({
        queryDefaults: defaultOptions?.query,
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
        },
    })

    return (
        <StateContext.Provider value={registryRef.current}>
            {children}
        </StateContext.Provider>
    )
}
