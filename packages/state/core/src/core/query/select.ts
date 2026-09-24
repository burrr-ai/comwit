import { serializeResourceArg } from './accessor'
import type {
  AnyResourceDescriptor,
  QueryBindingRegistry,
  QueryCacheKey,
  ResourceDataLike,
  ResourceDescriptorMap,
  ResourceRuntimeState,
} from './types'
import { RESOURCE_SUSPEND_COMMIT, RESOURCE_SUSPEND_PREPARE } from './types'

export type QuerySelectorLoad = {
  arg: unknown
  controller: ResourceDataLike
  hasArg: boolean
  key: QueryCacheKey
  path: string
  method: string
  mode: 'load' | 'suspend'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasNestedPath(pathMap: ResourceDescriptorMap, basePath: string) {
  const dotPrefix = `${basePath}.`
  const bracketPrefix = `${basePath}[`

  for (const key of pathMap.keys()) {
    if (key === basePath) return true
    if (key.startsWith(dotPrefix)) return true
    if (key.startsWith(bracketPrefix)) return true
  }

  return false
}

function selectorLoadsFor(
  registry: QueryBindingRegistry,
  controller: object
): Map<QueryCacheKey, Promise<unknown>> | undefined {
  return registry.selectorLoads.get(controller)
}

function pendingState(descriptor: AnyResourceDescriptor, isFetching: boolean) {
  return Object.freeze({
    ...descriptor.initialState,
    isLoading: true,
    isFetching,
    isError: false,
    error: null,
  }) as ResourceDataLike
}

function cachedState(
  state: ResourceDataLike,
  runtime: ResourceRuntimeState | undefined,
  controller: ResourceDataLike,
  descriptor: AnyResourceDescriptor,
  key: QueryCacheKey,
  registry: QueryBindingRegistry
): ResourceDataLike {
  const activeEntry = runtime?.activeKey === key ? runtime.cacheEntries.get(key) : undefined
  if (activeEntry) return state

  const entry = runtime?.cacheEntries.get(key)
  const pending =
    entry?.suspendPromise !== undefined ||
    (selectorLoadsFor(registry, controller)?.has(key) ?? false)

  if (entry?.hasQueried) {
    return Object.freeze({
      ...entry.state,
      isLoading: false,
      isFetching: pending,
    }) as ResourceDataLike
  }

  const entryState = entry?.state
  if (entryState?.isError === true) {
    return entryState
  }

  return pendingState(descriptor, pending)
}

function createResourceSelector(
  state: ResourceDataLike,
  controller: ResourceDataLike,
  descriptor: AnyResourceDescriptor,
  path: string,
  registry: QueryBindingRegistry,
  loads: QuerySelectorLoad[]
) {
  return new Proxy(state, {
    get(target, prop, receiver) {
      const selectorMethod = descriptor.selectorMethod ?? 'load'
      const isSuspend =
        prop === 'suspend' && selectorMethod === 'load' && descriptor.kind !== 'realtime'
      if (prop !== selectorMethod && !isSuspend) return Reflect.get(target, prop, receiver)

      return (...args: unknown[]) => {
        const hasArg = args.length > 0
        const arg = hasArg ? args[0] : undefined
        const key = serializeResourceArg(descriptor, arg)
        const load: QuerySelectorLoad = {
          arg,
          controller,
          hasArg,
          key,
          path,
          method: isSuspend ? 'suspend' : selectorMethod,
          mode: isSuspend ? 'suspend' : 'load',
        }
        loads.push(load)

        const runtime = registry.boundResourceRuntime.get(controller)
        return cachedState(state, runtime, controller, descriptor, key, registry)
      }
    },
  })
}

function bindSelectorPath(
  state: object,
  controller: object,
  descriptors: ResourceDescriptorMap,
  registry: QueryBindingRegistry,
  loads: QuerySelectorLoad[],
  path = ''
): object {
  return new Proxy(state, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver)

      const key = String(prop)
      const nextPath = path ? (Array.isArray(target) ? `${path}[${key}]` : `${path}.${key}`) : key
      const next = Reflect.get(target, prop, receiver)
      const descriptor = descriptors.get(nextPath)

      if (descriptor && isRecord(next)) {
        const bound = Reflect.get(controller, prop, controller)
        if (!isRecord(bound)) return next
        return createResourceSelector(next, bound, descriptor, nextPath, registry, loads)
      }

      if (isRecord(next) && hasNestedPath(descriptors, nextPath)) {
        const bound = Reflect.get(controller, prop, controller)
        if (!isRecord(bound)) return next
        return bindSelectorPath(next, bound, descriptors, registry, loads, nextPath)
      }

      return next
    },
  })
}

export function createQuerySelectorState<T extends object>(
  state: T,
  controller: object,
  descriptors: ResourceDescriptorMap,
  registry: QueryBindingRegistry,
  loads: QuerySelectorLoad[]
): T {
  if (descriptors.size === 0) return state
  const target = Object.isFrozen(state) ? { ...state } : state
  return bindSelectorPath(target, controller, descriptors, registry, loads) as T
}

export function querySelectorLoadKey(loads: QuerySelectorLoad[]): string {
  return JSON.stringify(loads.map(({ path, key, mode }) => [path, key, mode]))
}

/**
 * Starts every `.suspend()` request collected by the current selector after
 * useSyncExternalStore has finished reading its snapshot. The accessor only
 * mutates its non-observable key cache during this phase.
 */
export function prepareQuerySelectorSuspense(
  loads: QuerySelectorLoad[],
  registry: QueryBindingRegistry
): void {
  const suspendLoads = loads.filter((load) => load.mode === 'suspend')
  if (suspendLoads.length === 0) return

  const seen = new WeakMap<object, Set<QueryCacheKey>>()
  let firstPromise: Promise<unknown> | undefined
  let firstError: unknown

  for (const load of suspendLoads) {
    let controllerKeys = seen.get(load.controller)
    if (!controllerKeys) {
      controllerKeys = new Set()
      seen.set(load.controller, controllerKeys)
    }
    if (controllerKeys.has(load.key)) continue
    controllerKeys.add(load.key)

    const prepare = Reflect.get(load.controller, RESOURCE_SUSPEND_PREPARE)
    if (typeof prepare !== 'function') continue

    try {
      const promise = prepare.call(
        load.controller,
        load.arg,
        load.hasArg,
        load.key,
        load.controller
      )
      if (!firstPromise && promise instanceof Promise) firstPromise = promise
    } catch (error) {
      firstError ??= error
    }
  }

  if (firstError !== undefined) throw firstError
  if (firstPromise) throw firstPromise
}

export function runQuerySelectorLoads(
  loads: QuerySelectorLoad[],
  registry: QueryBindingRegistry
): void {
  runSelectedQueryLoads(
    loads.filter((load) => load.mode === 'load'),
    registry,
    false
  )
}

/** Commit render-staged `.suspend()` entries after React commits the tree. */
export function commitQuerySelectorSuspenseLoads(
  loads: QuerySelectorLoad[],
  registry: QueryBindingRegistry
): void {
  runSelectedQueryLoads(
    loads.filter((load) => load.mode === 'suspend'),
    registry,
    true
  )
}

function runSelectedQueryLoads(
  loads: QuerySelectorLoad[],
  registry: QueryBindingRegistry,
  commitSuspense: boolean
): void {
  const selected = new Map<string, QuerySelectorLoad>()

  for (const load of loads) {
    const identity = `${load.path}\u0000${load.key}`
    const previous = selected.get(identity)
    if (!previous || load.mode === 'suspend') selected.set(identity, load)
  }

  for (const load of selected.values()) {
    let pending = registry.selectorLoads.get(load.controller)
    if (!pending) {
      pending = new Map()
      registry.selectorLoads.set(load.controller, pending)
    }
    if (pending.has(load.key)) continue

    const controllerMethod = commitSuspense
      ? Reflect.get(load.controller, RESOURCE_SUSPEND_COMMIT)
      : load.controller[load.method === 'load' ? 'query' : load.method]
    if (typeof controllerMethod !== 'function') continue

    let promise: Promise<unknown>
    try {
      const result = commitSuspense
        ? controllerMethod.call(load.controller, load.arg, load.hasArg, load.key)
        : load.hasArg
          ? controllerMethod.call(load.controller, load.arg, undefined)
          : controllerMethod.call(load.controller)
      promise = Promise.resolve(result)
    } catch (error) {
      promise = Promise.reject(error)
    }

    pending.set(load.key, promise)
    promise
      .catch(() => {})
      .finally(() => {
        if (pending?.get(load.key) === promise) {
          pending.delete(load.key)
        }
      })
  }
}
