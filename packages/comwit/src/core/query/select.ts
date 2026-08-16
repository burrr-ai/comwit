import { serializeResourceArg } from './accessor'
import type {
  AnyResourceDescriptor,
  QueryBindingRegistry,
  QueryCacheKey,
  ResourceDataLike,
  ResourceDescriptorMap,
  ResourceRuntimeState,
} from './types'

export type QuerySelectorLoad = {
  arg: unknown
  controller: ResourceDataLike
  hasArg: boolean
  key: QueryCacheKey
  path: string
  method: string
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
  const pending = selectorLoadsFor(registry, controller)?.has(key) ?? false

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
      if (prop !== selectorMethod) return Reflect.get(target, prop, receiver)

      return (...args: unknown[]) => {
        const hasArg = args.length > 0
        const arg = hasArg ? args[0] : undefined
        const key = serializeResourceArg(descriptor, arg)
        loads.push({ arg, controller, hasArg, key, path, method: selectorMethod })

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
  return bindSelectorPath(state, controller, descriptors, registry, loads) as T
}

export function querySelectorLoadKey(loads: QuerySelectorLoad[]): string {
  return JSON.stringify(loads.map(({ path, key }) => [path, key]))
}

export function runQuerySelectorLoads(
  loads: QuerySelectorLoad[],
  registry: QueryBindingRegistry
): void {
  const seen = new Set<string>()

  for (const load of loads) {
    const identity = `${load.path}\u0000${load.key}`
    if (seen.has(identity)) continue
    seen.add(identity)

    let pending = registry.selectorLoads.get(load.controller)
    if (!pending) {
      pending = new Map()
      registry.selectorLoads.set(load.controller, pending)
    }
    if (pending.has(load.key)) continue

    const controllerMethod = load.controller[load.method === 'load' ? 'query' : load.method]
    if (typeof controllerMethod !== 'function') continue

    let promise: Promise<unknown>
    try {
      const result = load.hasArg
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
