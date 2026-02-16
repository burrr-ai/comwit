import React, { createContext, useContext, useRef } from 'react'
import {
  createQueryBindingRegistry,
  type QueryBindingRegistry,
  type QueryDefaultOptions,
} from './query'
import type { Model, StoreEntry } from './model'
import { isSilent } from './silent'

export type RegistryDefaults = {
  query?: QueryDefaultOptions
}

export type MuchaProviderProps = {
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
  if (!ctx) throw new Error('Wrap your app with <MuchaProvider>')
  return ctx
}

export function MuchaProvider({
  children,
  defaultOptions,
  context: initialContext = {},
}: MuchaProviderProps) {
  const storesRef = useRef<Map<symbol, StoreEntry>>(new Map())
  const contextRef = useRef<Record<string, unknown>>({})
  const queryBindingRegistryRef = useRef<QueryBindingRegistry>(createQueryBindingRegistry())

  const registryRef = useRef<StoreRegistry>({
    queryDefaults: defaultOptions?.query,
    queryBinding: queryBindingRegistryRef.current,
    get<T extends object>(model: Model<T>): StoreEntry<T> {
      const existing = storesRef.current.get(model.key)
      if (existing) return existing as StoreEntry<T>

      const entry = model.createStore({ isSilent })
      storesRef.current.set(model.key, entry)
      return entry as StoreEntry<T>
    },
  })

  for (const key of Object.keys(contextRef.current)) {
    if (!initialContext || !(key in initialContext)) {
      delete contextRef.current[key]
    }
  }

  if (initialContext) {
    Object.assign(contextRef.current, initialContext)
  }

  registryRef.current.queryDefaults = defaultOptions?.query
  registryRef.current.context = contextRef.current

  return <StateContext.Provider value={registryRef.current}>{children}</StateContext.Provider>
}
