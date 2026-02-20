import React, { createContext, useContext, useRef } from 'react'
import { getPlugins } from './plugin'
import type { QueryDefaultOptions } from './query'
import type { Model, StoreEntry } from './model'

export type RegistryDefaults = {
  query?: QueryDefaultOptions
  interceptors?: MethodDecorator[]
}

export type ComwitProviderProps = {
  children: React.ReactNode
  context?: Record<string, unknown>
  defaultOptions?: RegistryDefaults
}

export type StoreRegistry = {
  get<T extends object>(model: Model<T>): StoreEntry<T>
  context?: Record<string, unknown>
  pluginStates: Map<string, unknown>
  pluginDefaults: Map<string, Record<string, unknown> | undefined>
  /** @deprecated Use pluginDefaults.get('query') */
  queryDefaults?: RegistryDefaults['query']
  /** @deprecated Use pluginStates.get('query') */
  queryBinding: import('./query').QueryBindingRegistry
  globalInterceptors?: MethodDecorator[]
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
  >(null!)

  if (registryRef.current === null) {
    const plugins = getPlugins()
    const pluginStates = new Map<string, unknown>()
    const pluginDefaults = new Map<string, Record<string, unknown> | undefined>()

    for (const plugin of plugins) {
      const defaultKey = plugin.name as keyof RegistryDefaults
      const defaults = defaultOptions?.[defaultKey] as Record<string, unknown> | undefined
      pluginDefaults.set(plugin.name, defaults)
      pluginStates.set(plugin.name, plugin.createRegistryState(defaults))
    }

    registryRef.current = {
      queryDefaults: defaultOptions?.query,
      context: {},
      stores: new Map(),
      pluginStates,
      pluginDefaults,
      get queryBinding() {
        return pluginStates.get('query') as import('./query').QueryBindingRegistry
      },
      get<T extends object>(model: Model<T>): StoreEntry<T> {
        const existing = registryRef.current.stores.get(model.key)
        if (existing) return existing as StoreEntry<T>

        const entry = model.instance()
        registryRef.current.stores.set(model.key, entry)
        return entry as StoreEntry<T>
      },
    }
  }

  Object.keys(registryRef.current.context).forEach((key) => delete registryRef.current.context[key])
  Object.assign(registryRef.current.context, context)

  registryRef.current.queryDefaults = defaultOptions?.query
  registryRef.current.globalInterceptors = defaultOptions?.interceptors

  const plugins = getPlugins()
  for (const plugin of plugins) {
    const defaultKey = plugin.name as keyof RegistryDefaults
    const defaults = defaultOptions?.[defaultKey] as Record<string, unknown> | undefined
    registryRef.current.pluginDefaults.set(plugin.name, defaults)
  }

  return <StateContext.Provider value={registryRef.current}>{children}</StateContext.Provider>
}
