import React, { createContext, useContext, useRef } from 'react'
import { produce } from 'immer'
import type { Model } from './model'

type Listener = () => void

export type StoreEntry<T = any> = {
    snapshot: T
    listeners: Set<Listener>
    mutate(recipe: (draft: T) => void): void
}

export type StoreRegistry = {
    get<T>(model: Model<T>): StoreEntry<T>
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
        get<T>(model: Model<T>): StoreEntry<T> {
            const existing = storesRef.current.get(model.key)
            if (existing) return existing as StoreEntry<T>

            const entry: StoreEntry<T> = {
                snapshot: model.instance(),
                listeners: new Set(),
                mutate(recipe) {
                    entry.snapshot = produce(entry.snapshot, recipe)
                    entry.listeners.forEach(l => l())
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
