import { serializeResourceArg } from './accessor'
import { RESOURCE_HYDRATE } from './types'
import type { AnyResourceDescriptor, QueryHydrationEntries, ResourceDescriptorMap } from './types'

type HydrateQueryResourcesOptions<T extends object> = {
  controller: object
  descriptors: ResourceDescriptorMap
  entries: QueryHydrationEntries<T>
  mayInitialize: boolean
  phase: 'render' | 'commit'
}

function pathParts(path: string): string[] {
  return path.match(/[^.[\]]+/g) ?? []
}

function valueAtPath(source: unknown, path: string): unknown {
  let current = source
  for (const part of pathParts(path)) {
    if (typeof current !== 'object' || current === null) return undefined
    current = Reflect.get(current, part)
  }
  return current
}

function isHydrationSeed(value: unknown): value is { arg?: unknown; data: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, 'data')
  )
}

export function hydrateQueryResources<T extends object>({
  controller,
  descriptors,
  entries,
  mayInitialize,
  phase,
}: HydrateQueryResourcesOptions<T>): void {
  for (const [path, descriptor] of descriptors) {
    if (descriptor.kind === 'realtime' || descriptor.selectorMethod === 'restore') continue

    const seed = valueAtPath(entries, path)
    if (!isHydrationSeed(seed)) continue

    const bound = valueAtPath(controller, path) as Record<PropertyKey, unknown> | undefined
    const hydrate = bound?.[RESOURCE_HYDRATE]
    if (typeof hydrate !== 'function') continue

    const hasArg = Object.prototype.hasOwnProperty.call(seed, 'arg')
    const arg = hasArg ? seed.arg : undefined
    const key = serializeResourceArg(descriptor as AnyResourceDescriptor, arg)
    hydrate.call(bound, arg, hasArg, key, seed.data, mayInitialize, phase)
  }
}
