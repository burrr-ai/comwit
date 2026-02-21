import React, { createContext, useContext, useRef } from 'react'
import { getPlugins } from './plugin'
import type { Model, StoreEntry } from './model'
import type { StageMethodDecorator } from '../interceptors/utils'

export type RegistryDefaults = {
  interceptors?: StageMethodDecorator[]
  [pluginName: string]: unknown
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
  pluginDefaults: Map<string, unknown>
  globalInterceptors?: StageMethodDecorator[]
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
    const pluginDefaults = new Map<string, unknown>()

    for (const plugin of plugins) {
      const defaults = defaultOptions?.[plugin.name] as Record<string, unknown> | undefined
      pluginDefaults.set(plugin.name, defaults)
      pluginStates.set(plugin.name, plugin.createRegistryState(defaults))
    }

    registryRef.current = {
      context: {},
      stores: new Map(),
      pluginStates,
      pluginDefaults,
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

  registryRef.current.globalInterceptors = defaultOptions?.interceptors

  // Update plugin defaults on each render
  const plugins = getPlugins()
  for (const plugin of plugins) {
    const defaults = defaultOptions?.[plugin.name] as Record<string, unknown> | undefined
    registryRef.current.pluginDefaults.set(plugin.name, defaults)
  }

  return <StateContext.Provider value={registryRef.current}>{children}</StateContext.Provider>
}
