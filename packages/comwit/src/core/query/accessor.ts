import { snapshot } from '../proxy'
import { DEFAULT_GC_TIME } from './registry'
import {
  RESOURCE_QUERY_OPTION_KEYS,
  type AnyResourceDescriptor,
  type ConnectionStatus,
  type InfiniteResourceDescriptor,
  type PlaceholderData,
  type QueryBindingRegistry,
  type QueryCacheEntry,
  type QueryCacheKey,
  type QueryDefaultOptions,
  type QueryMode,
  type RealtimeResourceDescriptor,
  type ResourceBaseState,
  type ResourceContext,
  type ResourceDataLike,
  type ResourceInfiniteState,
  type ResourceQueryOptions,
  type ResourceRealtimeState,
  type ResourceRuntimeState,
  type ResourceSingleState,
  type SingleResourceDescriptor,
  type SubscribeCallbacks,
} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isResourceQueryCallOptions(
  value: unknown
): value is ResourceQueryOptions<unknown, unknown> {
  if (!isRecord(value)) return false
  for (const key of Object.keys(value)) {
    if (RESOURCE_QUERY_OPTION_KEYS.has(key)) return true
  }
  return false
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

function resolveGcTime(options: QueryDefaultOptions): number {
  if (typeof options.gcTime === 'number') return options.gcTime
  return DEFAULT_GC_TIME
}

export function mergeResult(state: ResourceDataLike, result: unknown, appendData = false) {
  if (result === undefined) return

  if (Array.isArray(result)) {
    state.data = result
    return
  }

  if (isRecord(result)) {
    const hasData = 'data' in result

    if (
      appendData &&
      hasData &&
      Array.isArray(state.data) &&
      Array.isArray((result as { data?: unknown }).data)
    ) {
      const next: ResourceDataLike = {
        ...result,
        data: [...state.data, ...(result as { data: unknown[] }).data],
      }
      Object.assign(state, next)
      return
    }

    if (hasData) {
      Object.assign(state, result)
      return
    }

    state.data = result
    return
  }

  state.data = result
}

function contextFor<TState>(state: TState) {
  return { state: snapshot(state as ResourceDataLike) as Readonly<TState> }
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Symbol.asyncIterator in (value as Record<symbol, unknown>)
  )
}

function parseQueryArgs(args: unknown[]) {
  if (args.length === 1 && isResourceQueryCallOptions(args[0])) {
    return {
      hasArg: false,
      arg: undefined,
      options: args[0] as ResourceQueryOptions<unknown, unknown>,
    }
  }

  if (args.length === 0) {
    return {
      hasArg: false,
      arg: undefined,
      options: undefined,
    }
  }

  return {
    hasArg: true,
    arg: args[0],
    options: args[1] as ResourceQueryOptions<unknown, unknown> | undefined,
  }
}

function stableSerialize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value
  if (value instanceof Date) return value.toISOString()

  if (Array.isArray(value)) {
    return value.map((item) => stableSerialize(item, seen))
  }

  if (seen.has(value as object)) {
    return '[Circular]'
  }
  seen.add(value as object)

  const source = value as Record<string, unknown>
  const keys = Object.keys(source).sort()
  const out: Record<string, unknown> = {}

  for (const key of keys) {
    out[key] = stableSerialize(source[key], seen)
  }

  seen.delete(value as object)
  return out
}

export function serializeQueryArg(arg: unknown) {
  try {
    const serialized = JSON.stringify(stableSerialize(arg))
    return serialized === undefined ? '__undefined__' : serialized
  } catch {
    return `__unserializable__:${String(arg)}`
  }
}

function cloneRuntime(path: string): ResourceRuntimeState {
  return {
    path,
    lastArg: undefined,
    activeKey: undefined,
    fetchId: 0,
    cacheEntries: new Map(),
    gcTime: DEFAULT_GC_TIME,
    gcTimers: new Map(),
  }
}

function createCacheEntry(
  state: ResourceDataLike,
  key: QueryCacheKey,
  arg: unknown
): QueryCacheEntry {
  return {
    key,
    arg,
    hasQueried: false,
    lastFetchedAt: 0,
    cursorHistory: [],
    state: snapshot(state) as ResourceDataLike,
  }
}

function applyCachedState(target: ResourceDataLike, cached: QueryCacheEntry) {
  Object.assign(target, cached.state)
  target.isLoading = false
  target.isFetching = false
}

function updateCachedState(entry: QueryCacheEntry, source: ResourceDataLike) {
  entry.state = snapshot(source) as ResourceDataLike
}

/**
 * Schedules eviction for every cache entry on every runtime owned by the
 * given model key. Called by the query plugin when the model's observer
 * count transitions to 0. Subsequent calls are idempotent — existing
 * timers are left in place.
 */
export function scheduleModelGc(registry: QueryBindingRegistry, modelKey: symbol) {
  const runtimes = registry.runtimesByModel.get(modelKey)
  if (!runtimes) return
  for (const runtime of runtimes) {
    for (const [key] of runtime.cacheEntries) {
      if (runtime.gcTimers.has(key)) continue
      const timer = setTimeout(() => {
        runtime.gcTimers.delete(key)
        runtime.cacheEntries.delete(key)
        if (runtime.activeKey === key) {
          runtime.activeKey = undefined
          runtime.lastArg = undefined
        }
      }, runtime.gcTime)
      runtime.gcTimers.set(key, timer)
    }
  }
}

/**
 * Cancels all pending GC timers across every runtime owned by the model.
 * Called by the query plugin when the model gains its first observer
 * (subscriber count transitions from 0 to 1).
 */
export function cancelModelGc(registry: QueryBindingRegistry, modelKey: symbol) {
  const runtimes = registry.runtimesByModel.get(modelKey)
  if (!runtimes) return
  for (const runtime of runtimes) {
    for (const timer of runtime.gcTimers.values()) {
      clearTimeout(timer)
    }
    runtime.gcTimers.clear()
  }
}

function applyPlaceholderData<TData, TArg>(
  state: ResourceBaseState<TData>,
  arg: TArg,
  placeholderData?: PlaceholderData<TData, TArg>
) {
  if (placeholderData === undefined) return

  if (typeof placeholderData === 'function') {
    state.data = (placeholderData as (queryArg: TArg, previousData: TData) => TData)(
      arg,
      state.data
    )
    return
  }

  state.data = placeholderData as TData
}

function normalizeDescriptorOptions<TData, TArg>(
  descriptor: AnyResourceDescriptor,
  defaultOptions: QueryDefaultOptions | undefined,
  callOptions: unknown
) {
  const descriptorOptions = descriptor.options as Omit<
    ResourceQueryOptions<TData, unknown>,
    'force'
  >
  const merged: ResourceQueryOptions<TData, TArg> = {
    ...(defaultOptions as Omit<
      ResourceQueryOptions<TData, unknown>,
      'force'
    > as ResourceQueryOptions<TData, TArg>),
    ...(descriptorOptions as ResourceQueryOptions<TData, TArg>),
    ...((isResourceQueryCallOptions(callOptions) ? callOptions : {}) as ResourceQueryOptions<
      TData,
      TArg
    >),
  }

  return merged
}

export function createResourceAccessor(
  state: ResourceDataLike,
  descriptor: AnyResourceDescriptor,
  path: string,
  defaults: QueryDefaultOptions | undefined,
  registry: QueryBindingRegistry,
  modelState?: object,
  modelKey?: symbol
): ResourceDataLike {
  if (registry.boundResourceValue.has(state)) {
    return registry.boundResourceValue.get(state) as ResourceDataLike
  }

  const runtime = registry.boundResourceRuntime.get(state) ?? cloneRuntime(path)
  runtime.path = path
  runtime.gcTime = resolveGcTime({
    ...(defaults ?? {}),
    ...(descriptor.options as QueryDefaultOptions),
  })
  registry.boundResourceRuntime.set(state, runtime)

  if (modelKey !== undefined) {
    let set = registry.runtimesByModel.get(modelKey)
    if (!set) {
      set = new Set()
      registry.runtimesByModel.set(modelKey, set)
    }
    set.add(runtime)
  }

  const getActiveEntry = () => {
    if (!runtime.activeKey) return
    return runtime.cacheEntries.get(runtime.activeKey)
  }

  function clearRefetchInterval() {
    if (runtime.refetchIntervalId != null) {
      clearInterval(runtime.refetchIntervalId)
      runtime.refetchIntervalId = undefined
    }
  }

  function scheduleRefetchInterval() {
    clearRefetchInterval()
    const ri = descriptor.refetchInterval
    if (ri === undefined || ri === false) return
    let ms: number | false
    if (typeof ri === 'function') {
      const error = state.isError ? new Error(state.error as string) : undefined
      ms = (ri as (data: unknown, error?: Error) => number | false)(state.data, error)
    } else {
      ms = ri
    }
    if (ms === false || ms <= 0) return
    runtime.refetchIntervalId = setInterval(() => {
      const result = refetch()
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        ;(result as Promise<unknown>).catch(() => {})
      }
    }, ms)
  }

  const executeQuery = async (
    arg: unknown,
    rawOptions: ResourceQueryOptions<unknown, unknown> | undefined,
    hasArg: boolean,
    mode: QueryMode,
    isRefetch = false
  ): Promise<unknown> => {
    // Check enabled condition
    if (descriptor.enabled && modelState) {
      if (!descriptor.enabled(modelState)) {
        return
      }
    }

    // Check dependsOn condition
    if (descriptor.dependsOn && modelState) {
      const dep = descriptor.dependsOn(modelState)
      if (dep && typeof dep === 'object' && 'isSuccess' in dep) {
        if (!dep.isSuccess) return
      } else if (dep === null || dep === undefined) {
        return
      }
    }

    const activeEntryBefore = getActiveEntry()
    if (isRefetch && !activeEntryBefore?.hasQueried) {
      return
    }

    // Check enabled condition
    if (descriptor.enabled && modelState) {
      if (!descriptor.enabled(modelState)) {
        return
      }
    }

    // Check dependsOn condition
    if (descriptor.dependsOn && modelState) {
      const dep = descriptor.dependsOn(modelState)
      if (dep && typeof dep === 'object' && 'isSuccess' in dep) {
        if (!dep.isSuccess) return
      } else if (dep === null || dep === undefined) {
        return
      }
    }

    const effectiveOptions = normalizeDescriptorOptions<unknown, unknown>(
      descriptor,
      defaults,
      rawOptions
    )

    const staleTime =
      typeof effectiveOptions.staleTime === 'number' ? effectiveOptions.staleTime : 0
    runtime.gcTime = resolveGcTime(effectiveOptions)
    const now = Date.now()

    const queryArg = isRefetch ? activeEntryBefore?.arg : hasArg ? arg : runtime.lastArg
    const queryKey = serializeQueryArg(queryArg)
    runtime.lastArg = queryArg
    runtime.activeKey = queryKey

    let entry = runtime.cacheEntries.get(queryKey)
    if (!entry) {
      entry = createCacheEntry(state, queryKey, queryArg)
      runtime.cacheEntries.set(queryKey, entry)
    } else {
      const pending = runtime.gcTimers.get(queryKey)
      if (pending !== undefined) {
        clearTimeout(pending)
        runtime.gcTimers.delete(queryKey)
      }
    }

    entry.arg = queryArg

    const shouldFetch =
      isRefetch ||
      !entry.hasQueried ||
      effectiveOptions.force === true ||
      staleTime === 0 ||
      now - entry.lastFetchedAt >= staleTime

    if (!shouldFetch && entry.hasQueried) {
      applyCachedState(state, entry)
      return entry.lastResult
    }

    if (entry.hasQueried) {
      applyCachedState(state, entry)
    }

    // Determine if args changed (new cache entry, not a refetch)
    const isArgChange = !isRefetch && !entry.hasQueried && activeEntryBefore?.hasQueried
    const hasPlaceholderData = effectiveOptions.placeholderData !== undefined

    // When args change and no placeholderData, reset to initial state
    if (isArgChange && !hasPlaceholderData) {
      Object.assign(state, descriptor.initialState)
    }

    applyPlaceholderData(
      state as ResourceBaseState<unknown>,
      queryArg as never,
      effectiveOptions.placeholderData as PlaceholderData<unknown, unknown> | undefined
    )

    if (descriptor.kind === 'infinite' && mode !== 'restore') {
      const infiniteHistory = entry.cursorHistory
      const currentCursor = (state as ResourceInfiniteState<unknown>).cursor

      if (mode === 'replace') {
        if (infiniteHistory.length === 0) {
          infiniteHistory.push(currentCursor)
        } else {
          infiniteHistory.length = 1
          infiniteHistory[0] = currentCursor
        }
      } else if (
        mode === 'append' &&
        infiniteHistory[infiniteHistory.length - 1] !== currentCursor
      ) {
        infiniteHistory.push(currentCursor)
      }
    }

    state.isError = false
    state.error = null
    // When args changed without placeholderData, this is a fresh load (isLoading=true)
    // When args changed with placeholderData, previous data is kept (isLoading=false)
    // When refetching same arg, data is kept (isLoading=false)
    if (isArgChange && !hasPlaceholderData) {
      state.isLoading = true
    } else {
      state.isLoading = !state.isSuccess
    }
    state.isFetching = true

    // Track suspense promise for initial loads (not refetches)
    if (descriptor.suspense && state.isLoading && !isRefetch) {
      let resolvePromise!: () => void
      const promise = new Promise<unknown>((resolve) => {
        resolvePromise = resolve as () => void
      })
      registry.suspense.set(path, { promise, error: null })
      // Store resolver on the state object for later cleanup
      ;(registry.suspense.get(path) as any).__resolve = resolvePromise
    }

    // Abort any active stream before starting a new query
    if (runtime.streamAbortController) {
      runtime.streamAbortController.abort()
      runtime.streamAbortController = undefined
    }

    const currentFetchId = ++runtime.fetchId

    try {
      let result: unknown

      if (descriptor.kind === 'single' || descriptor.kind === 'realtime') {
        const typedDescriptor = descriptor as SingleResourceDescriptor<unknown, unknown>
        result = await typedDescriptor.queryFn(
          queryArg as unknown,
          contextFor(state) as ResourceContext<ResourceSingleState<unknown>>
        )
      } else {
        const typedDescriptor = descriptor as InfiniteResourceDescriptor<unknown, unknown>
        result = await typedDescriptor.queryFn(
          queryArg as unknown,
          contextFor(state) as ResourceContext<ResourceInfiniteState<unknown>>
        )
      }

      if (runtime.fetchId !== currentFetchId) {
        return result
      }

      // Handle AsyncIterable (streaming) results
      if (isAsyncIterable(result)) {
        // Mark as queried so refetch() works during streaming
        entry.hasQueried = true

        const abortController = new AbortController()
        runtime.streamAbortController = abortController
        const batchInterval = descriptor.streamBatchInterval

        let lastYield: unknown
        try {
          let lastBatchTime = 0
          for await (const chunk of result) {
            if (abortController.signal.aborted || runtime.fetchId !== currentFetchId) {
              return lastYield
            }

            // Apply batch interval coalescing
            if (batchInterval && batchInterval > 0) {
              const now = Date.now()
              const elapsed = now - lastBatchTime
              if (elapsed < batchInterval && lastBatchTime > 0) {
                await new Promise<void>((resolve) => setTimeout(resolve, batchInterval - elapsed))
                if (abortController.signal.aborted || runtime.fetchId !== currentFetchId) {
                  return lastYield
                }
              }
              lastBatchTime = Date.now()
            }

            lastYield = chunk
            mergeResult(state, chunk)
          }
        } catch (streamError) {
          if (abortController.signal.aborted) {
            return lastYield
          }
          throw streamError
        } finally {
          if (runtime.streamAbortController === abortController) {
            runtime.streamAbortController = undefined
          }
        }

        state.isSuccess = true
        entry.lastFetchedAt = Date.now()
        entry.lastResult = lastYield
        updateCachedState(entry, state)

        scheduleRefetchInterval()
        return lastYield
      }

      // Non-streaming path (original behavior)
      if (descriptor.kind === 'single' || descriptor.kind === 'realtime') {
        mergeResult(state, result)
      } else {
        mergeResult(state, result, mode === 'append')
      }

      state.isSuccess = true
      entry.hasQueried = true
      entry.lastFetchedAt = Date.now()
      entry.lastResult = result
      updateCachedState(entry, state)

      if (descriptor.kind === 'infinite' && mode !== 'restore') {
        const infiniteHistory = entry.cursorHistory
        const nextCursor = (state as ResourceInfiniteState<unknown>).cursor

        if (mode === 'append' && infiniteHistory[infiniteHistory.length - 1] !== nextCursor) {
          infiniteHistory.push(nextCursor)
        } else if (mode === 'replace' && infiniteHistory.length > 0) {
          infiniteHistory[infiniteHistory.length - 1] = nextCursor
        }
      }

      if (descriptor.kind === 'realtime') {
        startSubscription()
      }

      scheduleRefetchInterval()

      return result
    } catch (error) {
      if (runtime.fetchId !== currentFetchId) {
        throw error
      }
      state.isError = true
      state.isSuccess = false
      state.error = normalizeError(error)

      // Store error in suspense state for ErrorBoundary
      if (descriptor.suspense) {
        const suspenseEntry = registry.suspense.get(path)
        if (suspenseEntry) {
          suspenseEntry.error = error instanceof Error ? error : new Error(normalizeError(error))
          // Don't re-throw — let checkSuspense throw it during render
          scheduleRefetchInterval()
          return
        }
      }

      scheduleRefetchInterval()
      throw error
    } finally {
      if (runtime.fetchId === currentFetchId) {
        state.isLoading = false
        state.isFetching = false

        // Resolve suspense promise so React can re-render
        if (descriptor.suspense) {
          const suspenseEntry = registry.suspense.get(path)
          if (suspenseEntry) {
            const resolve = (suspenseEntry as any).__resolve as (() => void) | undefined
            if (resolve) resolve()
            // Only clean up if no error — error entries are cleaned up in checkSuspense
            if (!suspenseEntry.error) {
              registry.suspense.delete(path)
            }
          }
        }
      }
    }
  }

  const queryFn = (...rawArgs: unknown[]) => {
    const parsed = parseQueryArgs(rawArgs)
    return executeQuery(parsed.arg, parsed.options, parsed.hasArg, 'replace', false)
  }

  const refetch = () => {
    const active = getActiveEntry()
    if (!active?.hasQueried) return Promise.resolve()
    return executeQuery(active.arg, undefined, true, 'replace', true)
  }

  const nextFetch = (...rawArgs: unknown[]) => {
    if (descriptor.kind !== 'infinite') return
    if (!(state as ResourceInfiniteState<unknown>).hasMore) return
    const active = getActiveEntry()
    const inputArg = rawArgs[0]

    const effectiveArg = inputArg !== undefined ? inputArg : (active?.arg ?? runtime.lastArg)
    const hasArg = inputArg !== undefined || active !== undefined

    return executeQuery(effectiveArg, { force: true }, hasArg, 'append', false)
  }

  const previousFetch = (...rawArgs: unknown[]) => {
    const parsed = parseQueryArgs(rawArgs)
    if (descriptor.kind !== 'infinite') return
    const active = getActiveEntry()
    if (!active) return

    if (active.cursorHistory.length < 2) {
      return active.lastResult
    }

    active.cursorHistory.pop()
    const effectiveArg = parsed.hasArg ? parsed.arg : active.arg
    return executeQuery(effectiveArg, parsed.options, true, 'restore', false)
  }

  const startSubscription = () => {
    if (descriptor.kind !== 'realtime') return
    const realtimeDescriptor = descriptor as RealtimeResourceDescriptor<unknown, unknown>
    const realtimeState = state as unknown as ResourceRealtimeState<unknown>

    // Clean up existing subscription
    if (runtime.subscriptionCleanup) {
      runtime.subscriptionCleanup()
      runtime.subscriptionCleanup = undefined
    }

    realtimeState.connectionStatus = 'connecting'
    realtimeState.isConnected = false

    const callbacks: SubscribeCallbacks<unknown> = {
      update: (updater: (prev: unknown) => unknown) => {
        state.data = updater(state.data)
      },
      set: (data: unknown) => {
        state.data = data
      },
      refetch: () => {
        return queryFn() as unknown as void
      },
      onStatus: (status: ConnectionStatus) => {
        realtimeState.connectionStatus = status
        realtimeState.isConnected = status === 'connected'
      },
      onError: (error: unknown) => {
        state.isError = true
        state.error = normalizeError(error)
      },
    }

    const cleanup = realtimeDescriptor.subscribe(callbacks)
    runtime.subscriptionCleanup = cleanup
  }

  const unsubscribe = () => {
    if (runtime.subscriptionCleanup) {
      runtime.subscriptionCleanup()
      runtime.subscriptionCleanup = undefined
    }
    if (descriptor.kind === 'realtime') {
      const realtimeState = state as unknown as ResourceRealtimeState<unknown>
      realtimeState.connectionStatus = 'disconnected'
      realtimeState.isConnected = false
    }
  }

  const bound = new Proxy(state, {
    get(target, prop) {
      if (prop === 'query') return queryFn
      if (prop === 'refetch') return refetch
      if (prop === 'unsubscribe') {
        if (descriptor.kind === 'realtime') return unsubscribe
        return undefined
      }
      if (prop === 'nextFetch') {
        if (descriptor.kind === 'infinite') return nextFetch
        return undefined
      }
      if (prop === 'previousFetch') {
        if (descriptor.kind === 'infinite') return previousFetch
        return undefined
      }
      if (prop === 'set') {
        return (next: unknown) => {
          if (isRecord(next)) {
            Object.assign(target, next)
          } else {
            target.data = next
          }

          target.isSuccess = true
          target.isError = false
          target.error = null

          const activeEntry = getActiveEntry()
          if (activeEntry) {
            updateCachedState(activeEntry, target)
          }

          return next
        }
      }

      return Reflect.get(target, prop)
    },
  })

  registry.boundResourceValue.set(state, bound)
  registry.boundResourceRuntime.set(bound, runtime)
  return bound
}
