import { useCallback, useRef, useSyncExternalStore } from 'react'
import { createProxy, snapshot, subscribe } from './proxy'
import { isResourceDescriptor, ResourceDescriptorMap, checkSuspense } from './query'
import { useStoreRegistry } from './provider'
import { isEqual } from '../utils'
import { isSilent } from './silent'

export type StoreEntry<T extends object = any> = {
  proxy: T
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

export type ModelOptions<T extends object, D extends object = {}> = {
  derive?: (state: T) => { [K in keyof D]: () => D[K] }
  rules?: { [K in keyof T]?: (value: T[K]) => true | string }
}

export type ValidationState<T> = {
  errors: { [K in keyof T]?: string | null }
  isValid: boolean
}

export function model<T extends object>(initial: T): Model<T>
export function model<T extends object, D extends object>(
  initial: T,
  options: ModelOptions<T, D>
): Model<T & Readonly<D> & { $validation: ValidationState<T> }>
export function model<T extends object, D extends object = {}>(
  initial: T,
  options?: ModelOptions<T, D>
): Model<T & Readonly<D>> {
  const resources: ResourceDescriptorMap = new Map()
  const template = normalize(initial as Record<string, unknown>, '', resources)
  const cloneState = () => structuredClone(template) as T

  const m: Model<T & Readonly<D>> = {
    key: Symbol(),
    resources,
    instance(): StoreEntry<T & Readonly<D>> {
      const p = createProxy(cloneState())

      const deriveFactory = options?.derive
      const rules = options?.rules
      let derivedGetters: Record<string, () => unknown> | null = null
      let derivedKeys: Set<string> | null = null

      if (deriveFactory) {
        derivedGetters = deriveFactory(p as T) as Record<string, () => unknown>
        derivedKeys = new Set(Object.keys(derivedGetters))
      }

      const hasExtensions = derivedGetters != null || rules != null

      let publicProxy: unknown = p
      if (hasExtensions) {
        publicProxy = new Proxy(p as object, {
          get(target, prop, receiver) {
            if (typeof prop === 'string' && derivedKeys?.has(prop)) {
              return derivedGetters![prop]()
            }
            if (prop === '$validation' && rules) {
              return computeValidation(p as Record<string, unknown>, rules)
            }
            return Reflect.get(target, prop, receiver)
          },
          set(target, prop, value, receiver) {
            if (typeof prop === 'string' && derivedKeys?.has(prop)) {
              throw new Error(`Cannot set derived field "${prop}"`)
            }
            if (prop === '$validation') {
              throw new Error('Cannot set $validation')
            }
            return Reflect.set(target, prop, value, receiver)
          },
        })
      }

      return {
        proxy: publicProxy as T & Readonly<D>,
        getSnapshot() {
          if (!hasExtensions) return snapshot(p) as T & Readonly<D>

          const base = snapshot(p)
          const result: Record<string, unknown> = { ...(base as object) }

          if (derivedGetters) {
            for (const [key, getter] of Object.entries(derivedGetters)) {
              result[key] = getter()
            }
          }

          if (rules) {
            result.$validation = computeValidation(p as Record<string, unknown>, rules)
          }

          return Object.freeze(result) as T & Readonly<D>
        },
        subscribe(listener) {
          return subscribe(p, () => {
            if (!isSilent()) listener()
          })
        },
      }
    },
  }

  return m
}

function computeValidation<T extends object>(
  proxy: Record<string, unknown>,
  rules: { [K in keyof T]?: (value: T[K]) => true | string }
): ValidationState<T> {
  const errors: Record<string, string | null> = {}
  let isValid = true
  for (const [field, validator] of Object.entries(rules)) {
    if (!validator) continue
    const value = proxy[field]
    const result = (validator as (v: unknown) => true | string)(value)
    if (result === true) {
      errors[field] = null
    } else {
      errors[field] = typeof result === 'string' ? result : `Invalid ${field}`
      isValid = false
    }
  }
  return { errors, isValid } as ValidationState<T>
}

export type Model<T extends object> = {
  key: symbol
  resources: ResourceDescriptorMap
  instance(): StoreEntry<T>
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

  const result = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // Check suspense state — throws promise for Suspense or error for ErrorBoundary
  if (m.resources.size > 0) {
    checkSuspense(m.resources, registry.queryBinding)
  }

  return result
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
