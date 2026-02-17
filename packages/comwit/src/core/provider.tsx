import React, { createContext, useContext, useRef } from 'react'
import {
  createQueryBindingRegistry,
  type QueryBindingRegistry,
  type QueryDefaultOptions,
} from './query'
import type { Model, StoreEntry } from './model'

export type RegistryDefaults = {
  query?: QueryDefaultOptions
}

export type ComwitProviderProps = {
  children: React.ReactNode
  context?: Record<string, unknown>
  defaultOptions?: RegistryDefaults
}

export type StoreRegistry = {
  get<T extends object>(model: Model<T>): StoreEntry<T>
  context?: Record<string, unknown>
  queryDefaults?: RegistryDefaults['query']
  queryBinding: QueryBindingRegistry
}

const StateContext = createContext<StoreRegistry | null>(null)

export function useStoreRegistry(): StoreRegistry {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('Wrap your app with <ComwitProvider>')
  return ctx
}

export function ComwitProvider({ children, defaultOptions, context = {} }: ComwitProviderProps) {
  const registryRef = useRef<
    StoreRegistry & {
      stores: Map<symbol, StoreEntry>
      context: Record<string, unknown>
    }
  >({
    queryDefaults: defaultOptions?.query,
    context: {},
    stores: new Map(),
    queryBinding: createQueryBindingRegistry(),
    get<T extends object>(model: Model<T>): StoreEntry<T> {
      const existing = registryRef.current.stores.get(model.key)
      if (existing) return existing as StoreEntry<T>

      const entry = model.instance()
      registryRef.current.stores.set(model.key, entry)
      return entry as StoreEntry<T>
    },
  })

  Object.keys(registryRef.current.context).forEach((key) => delete registryRef.current.context[key])
  Object.assign(registryRef.current.context, context)

  registryRef.current.queryDefaults = defaultOptions?.query

  return <StateContext.Provider value={registryRef.current}>{children}</StateContext.Provider>
}
