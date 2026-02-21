import {
  type AnyResourceDescriptor,
  type QueryBindingRegistry,
  type QueryDefaultOptions,
  type ResourceDataLike,
  type ResourceDescriptorMap,
} from './types'
import { createResourceAccessor } from './accessor'
import { createQueryBindingRegistry } from './registry'

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

function bindPath(
  state: object,
  descriptors: ResourceDescriptorMap,
  path = '',
  defaults: QueryDefaultOptions | undefined,
  registry: QueryBindingRegistry,
  modelState?: object
): any {
  if (!descriptors.size) return state

  const cached = registry.boundPathProxy.get(state)
  if (cached?.has(path)) {
    return cached.get(path) as object
  }

  const proxy = new Proxy(state, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver)

      const key = String(prop)
      const nextPath = path ? (Array.isArray(target) ? `${path}[${key}]` : `${path}.${key}`) : key

      const descriptor = descriptors.get(nextPath)
      const next = Reflect.get(target, prop, receiver)

      if (descriptor && isRecord(next)) {
        return createResourceAccessor(
          next as ResourceDataLike,
          descriptor as AnyResourceDescriptor,
          nextPath,
          defaults,
          registry,
          modelState
        )
      }

      if (isRecord(next) && hasNestedPath(descriptors, nextPath)) {
        return bindPath(next, descriptors, nextPath, defaults, registry, modelState)
      }

      return next
    },
  })

  const map = registry.boundPathProxy.get(state) ?? new Map<string, object>()
  map.set(path, proxy)
  registry.boundPathProxy.set(state, map)

  return proxy
}

export function bindResourceState<T extends object>(
  modelState: T,
  resourceDescriptors: ResourceDescriptorMap,
  defaults?: QueryDefaultOptions,
  registry: QueryBindingRegistry = createQueryBindingRegistry()
): T {
  if (!resourceDescriptors.size) return modelState
  return bindPath(modelState, resourceDescriptors, '', defaults, registry, modelState) as T
}
