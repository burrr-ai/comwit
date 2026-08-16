import React, { createContext, useContext, useRef, type Context } from 'react'
import { getPlugins } from './plugin'
import type { Model, StoreEntry } from './model'
import type { StageMethodDecorator } from '../interceptors/utils'
import { getDevTools, initDevTools } from './devtools'
import type { LocalDefaults } from './local'

export type RegistryDefaults = {
  interceptors?: StageMethodDecorator[]
  local?: LocalDefaults
  [pluginName: string]: unknown
}

export type ComwitProviderProps = {
  children: React.ReactNode
  context?: Record<string, unknown>
  defaultOptions?: RegistryDefaults
}

export type LifecycleState = {
  subscriberCount: number
  cleanup: (() => void) | null
}

export type StoreRegistry = {
  get<T extends object>(model: Model<T>): StoreEntry<T>
  getLifecycle(model: Model<any>): LifecycleState
  context?: Record<string, unknown>
  pluginStates: Map<string, unknown>
  pluginDefaults: Map<string, unknown>
  globalInterceptors?: StageMethodDecorator[]
}

// Lazily create the React Context the first time the provider or a hook is
// invoked. Calling createContext() at module top-level would crash the
// moment this module is evaluated under React Server Components (the
// RSC-vendored React build does not export createContext), even when only
// the proxy utilities (snapshot/isProxy) are needed at the import site.
let _StateContext: Context<StoreRegistry | null> | null = null
function getStateContext(): Context<StoreRegistry | null> {
  if (_StateContext === null) {
    _StateContext = createContext<StoreRegistry | null>(null)
  }
  return _StateContext
}

export function useStoreRegistry(): StoreRegistry {
  const ctx = useContext(getStateContext())
  if (!ctx) throw new Error('Wrap your app with <ComwitProvider>')
  return ctx
}

export function ComwitProvider({ children, defaultOptions, context = {} }: ComwitProviderProps) {
  const registryRef = useRef<
    StoreRegistry & {
      stores: Map<symbol, StoreEntry>
      lifecycles: Map<symbol, LifecycleState>
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
      pluginStates.set(
        plugin.name,
        plugin.createRegistryState(defaults, defaultOptions as Record<string, unknown> | undefined)
      )
    }

    if (process.env.NODE_ENV !== 'production') {
      initDevTools()
    }

    registryRef.current = {
      context: {},
      stores: new Map(),
      lifecycles: new Map(),
      pluginStates,
      pluginDefaults,
      get<T extends object>(model: Model<T>): StoreEntry<T> {
        const existing = registryRef.current.stores.get(model.key)
        if (existing) return existing as StoreEntry<T>

        const entry = model.instance()
        registryRef.current.stores.set(model.key, entry)

        if (process.env.NODE_ENV !== 'production') {
          getDevTools()?.registerStore(model, entry)
        }

        return entry as StoreEntry<T>
      },
      getLifecycle(model: Model<any>): LifecycleState {
        const existing = registryRef.current.lifecycles.get(model.key)
        if (existing) return existing
        const state: LifecycleState = { subscriberCount: 0, cleanup: null }
        registryRef.current.lifecycles.set(model.key, state)
        return state
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

  const StateContext = getStateContext()
  return <StateContext.Provider value={registryRef.current}>{children}</StateContext.Provider>
}
