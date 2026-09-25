import React, {
  createContext,
  useContext,
  useId,
  useRef,
  useEffect,
  useLayoutEffect,
  type Context,
} from 'react'
import { getPlugins } from './plugin'
import type { Model, StoreEntry } from './model'
import type { StageMethodDecorator } from '../interceptors/utils'
import { getDevTools, initDevTools } from './devtools'
import type { LocalDefaults } from './local'
import type { QueryBindingRegistry, QueryDefaultOptions } from './query/types'
import { createSuspendStream, escapeJsonForHtml, SUSPEND_STREAM_ATTRIBUTE } from './query/stream'
import {
  createBrowserRouterAdapter,
  prepareSearchParamStore,
  serverSearchParamValues,
  type RouterAdapter,
} from './router'

const useCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export type RegistryDefaults = {
  query?: QueryDefaultOptions
  interceptors?: StageMethodDecorator[]
  local?: LocalDefaults
  [pluginName: string]: unknown
}

/**
 * Framework hook that inserts the returned element into the HTML stream before the next flushed
 * chunk. Next.js exports it as `useServerInsertedHTML` from `next/navigation`.
 */
export type ServerInsertedHTMLHook = (callback: () => React.ReactNode) => void

export type ComwitProviderProps = {
  children: React.ReactNode
  context?: Record<string, unknown>
  defaultOptions?: RegistryDefaults
  /** Read once during server rendering. Return null when request search is unavailable. Never called in the browser. */
  getServerSearchParams?: () => string | null
  /**
   * Experimental. Streams `.suspend()` results resolved during server rendering into the browser
   * cache, so the hydrating selector renders the same data without calling `queryFn` again. Pass
   * Next.js `useServerInsertedHTML`; the provider inserts an inert JSON script ahead of each
   * flushed Suspense boundary. Read once at mount; it must not change afterwards.
   */
  useServerInsertedHTML?: ServerInsertedHTMLHook
}

export type LifecycleState = {
  subscriberCount: number
  cleanup: (() => void) | null
}

export type StoreRegistry = {
  get<T extends object>(model: Model<T>): StoreEntry<T>
  getLifecycle(model: Model<any>): LifecycleState
  observe(model: Model<any>): () => void
  dispose(): void
  context?: Record<string, unknown>
  pluginStates: Map<string, unknown>
  pluginDefaults: Map<string, unknown>
  globalInterceptors?: StageMethodDecorator[]
  /** Internal URL transport; ordinary model hooks do not subscribe to it. */
  router: RouterAdapter
  serverSearch: string | null
  searchParamOwners: Map<string, { model: symbol; path: string }>
}

let _StateContext: Context<StoreRegistry | null> | null = null
function getStateContext(): Context<StoreRegistry | null> {
  if (_StateContext === null) _StateContext = createContext<StoreRegistry | null>(null)
  return _StateContext
}

export function useStoreRegistry(): StoreRegistry {
  const ctx = useContext(getStateContext())
  if (!ctx) throw new Error('Wrap your app with <ComwitProvider>')
  return ctx
}

function readServerSearch(id: string): string | null {
  const element = document.getElementById(id)
  if (
    !element ||
    element.tagName.toLowerCase() !== 'script' ||
    !element.hasAttribute('data-comwit-search')
  )
    return null
  try {
    const value: unknown = JSON.parse(element.textContent ?? 'null')
    return typeof value === 'string' ? value : null
  } catch {
    return null
  }
}

function serializeServerSearch(search: string | null): string {
  return escapeJsonForHtml(JSON.stringify(search))
}

export function ComwitProvider({
  children,
  defaultOptions,
  context = {},
  getServerSearchParams,
  useServerInsertedHTML,
}: ComwitProviderProps) {
  const reactId = useId()
  const id = `comwit-search-${reactId}`
  const registryRef = useRef<StoreRegistry>(null!)
  const transfer = useRef(Boolean(getServerSearchParams))
  // A framework hook is called conditionally below; fixing it at mount keeps hook order stable.
  const insertServerHTML = useRef(useServerInsertedHTML).current

  if (registryRef.current === null) {
    const serverSearch =
      typeof window === 'undefined'
        ? (getServerSearchParams?.() ?? null)
        : transfer.current
          ? readServerSearch(id)
          : null
    if (serverSearch !== null && typeof serverSearch !== 'string') {
      throw new TypeError('getServerSearchParams() must synchronously return a string or null')
    }
    const pluginStates = new Map<string, unknown>()
    const pluginDefaults = new Map<string, unknown>()
    for (const plugin of getPlugins()) {
      const defaults = defaultOptions?.[plugin.name] as Record<string, unknown> | undefined
      pluginDefaults.set(plugin.name, defaults)
      pluginStates.set(plugin.name, plugin.createRegistryState(defaults, defaultOptions))
    }
    // Server requests must not retain their model instances in a global debug registry.
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') initDevTools()
    const stores = new Map<symbol, StoreEntry>()
    const lifecycles = new Map<symbol, LifecycleState>()
    const urlModels = new Map<symbol, { start(): () => void }>()
    const urlObservers = new Map<symbol, { count: number; stop(): void }>()
    const registry: StoreRegistry = {
      context: {},
      pluginStates,
      pluginDefaults,
      serverSearch,
      router: createBrowserRouterAdapter(),
      searchParamOwners: new Map(),
      get<T extends object>(model: Model<T>): StoreEntry<T> {
        const existing = stores.get(model.key)
        if (existing) return existing as StoreEntry<T>
        const initial =
          typeof window === 'undefined' ? serverSearchParamValues(model, serverSearch) : undefined
        const entry = model.instance(initial)
        const url = prepareSearchParamStore(
          model,
          entry,
          registry.router,
          serverSearch,
          registry.searchParamOwners
        )
        if (url) urlModels.set(model.key, url)
        stores.set(model.key, entry)
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined')
          getDevTools()?.registerStore(model, entry)
        return entry
      },
      getLifecycle(model) {
        const existing = lifecycles.get(model.key)
        if (existing) return existing
        const lifecycle = { subscriberCount: 0, cleanup: null }
        lifecycles.set(model.key, lifecycle)
        return lifecycle
      },
      observe(model) {
        registry.get(model)
        const url = urlModels.get(model.key)
        if (!url) return () => {}
        let state = urlObservers.get(model.key)
        if (!state) {
          state = { count: 0, stop: url.start() }
          urlObservers.set(model.key, state)
        }
        state.count++
        const current = state
        return () => {
          if (urlObservers.get(model.key) !== current) return
          if (--current.count === 0) {
            urlObservers.delete(model.key)
            current.stop()
          }
        }
      },
      dispose() {
        for (const state of urlObservers.values()) state.stop()
        urlObservers.clear()
        const queries = pluginStates.get('query') as QueryBindingRegistry | undefined
        for (const runtimes of queries?.runtimesByModel.values() ?? []) {
          for (const runtime of runtimes) runtime.slowLoading?.pause()
        }
      },
    }
    const queryRegistry = pluginStates.get('query') as QueryBindingRegistry | undefined
    if (queryRegistry) {
      queryRegistry.getModelState = (source) => registry.get(source as Model<object>).proxy
      if (insertServerHTML) {
        queryRegistry.suspendStream = createSuspendStream(reactId, typeof window === 'undefined')
      }
    }
    registryRef.current = registry
  }

  const registry = registryRef.current
  // Next.js runs the callback on the server whenever a chunk is flushed and ignores it in the
  // browser. Each flush drains the results resolved since the previous one.
  insertServerHTML?.(() => {
    const queries = registry.pluginStates.get('query') as QueryBindingRegistry | undefined
    const payload = queries?.suspendStream?.flush()
    if (!payload) return null
    return (
      <script
        type="application/json"
        {...{ [SUSPEND_STREAM_ATTRIBUTE]: reactId }}
        dangerouslySetInnerHTML={{ __html: payload }}
      />
    )
  })
  useCommitEffect(() => {
    // Strict Mode may reactivate the same provider, including action-only queries.
    const queries = registry.pluginStates.get('query') as QueryBindingRegistry | undefined
    for (const [key, runtimes] of queries?.runtimesByModel ?? []) {
      if (!queries?.unobservedModels.has(key)) {
        for (const runtime of runtimes) runtime.slowLoading?.resume()
      }
    }
    return () => registry.dispose()
  }, [registry])
  const sharedContext = registry.context!
  Object.keys(sharedContext).forEach((key) => delete sharedContext[key])
  Object.assign(sharedContext, context)
  registry.globalInterceptors = defaultOptions?.interceptors
  for (const plugin of getPlugins()) {
    registry.pluginDefaults.set(plugin.name, defaultOptions?.[plugin.name])
  }
  const StateContext = getStateContext()
  return (
    <StateContext.Provider value={registry}>
      {transfer.current ? (
        <>
          <script
            id={id}
            type="application/json"
            data-comwit-search=""
            dangerouslySetInnerHTML={{ __html: serializeServerSearch(registry.serverSearch) }}
          />
          <React.Fragment key="models">{children}</React.Fragment>
        </>
      ) : (
        children
      )}
    </StateContext.Provider>
  )
}
