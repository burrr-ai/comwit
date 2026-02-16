import { useCallback, useRef, useSyncExternalStore } from 'react'
import { createProxy, snapshot, subscribe } from './proxy'
import { isResourceDescriptor, ResourceDescriptorMap } from './query'
import { useStoreRegistry } from './provider'
import { isEqual } from '../utils'

export type StoreRuntime = {
  isSilent: () => boolean
}

export type StoreEntry<T extends object = any> = {
  proxy: T
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

export function model<T extends object>(initial: T): Model<T> {
  const resources: ResourceDescriptorMap = new Map()
  const template = normalize(initial as Record<string, unknown>, '', resources)
  const instance = () => structuredClone(template) as T

  const m: Model<T> = {
    key: Symbol(),
    resources,
    createStore(runtime: StoreRuntime): StoreEntry<T> {
      const p = createProxy(instance())
      return {
        proxy: p,
        getSnapshot() {
          return snapshot(p) as T
        },
        subscribe(listener) {
          return subscribe(p, () => {
            if (!runtime.isSilent()) listener()
          })
        },
      }
    },
  }

  return m
}

export type Model<T extends object> = {
  key: symbol
  resources: ResourceDescriptorMap
  createStore(runtime: StoreRuntime): StoreEntry<T>
}

export function useModel<T extends object>(m: Model<T>): T
export function useModel<T extends object, R>(m: Model<T>, selector: (state: T) => R): R
export function useModel<T extends object, R>(m: Model<T>, selector?: (state: T) => R): T | R {
  const registry = useStoreRegistry()
  const store = registry.get(m)

  const prevRef = useRef<unknown>(null)

  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store])

  const getSnapshot = () => {
    const raw = store.getSnapshot()
    const next = selector ? selector(raw) : raw

    if (prevRef.current !== null && isEqual(prevRef.current, next)) {
      return prevRef.current as R
    }

    prevRef.current = next
    return next as R
  }

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function normalize(value: unknown, path: string, resources: ResourceDescriptorMap): unknown {
  if (isResourceDescriptor(value)) {
    if (!path) throw new Error('query() entry must be assigned to a model field')
    resources.set(path, value)
    return value.initialState
  }

  if (!value || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map((item, index) => normalize(item, `${path}[${index}]`, resources))
  }

  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value)) {
    const nextPath = path ? `${path}.${key}` : key
    out[key] = normalize((value as Record<string, unknown>)[key], nextPath, resources)
  }

  return out
}
