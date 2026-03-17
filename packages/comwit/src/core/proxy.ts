// Proxy-based reactivity engine
// Based on valtio (https://github.com/pmndrs/valtio) — MIT License
// Per-proxy state stored on objects via Symbols; fallback WeakMaps only for
// non-extensible objects (e.g. frozen snapshots) which are inherently safe for SSR.

const isObject = (x: unknown): x is object => typeof x === 'object' && x !== null

// Internal symbols — replace module-level WeakMaps for extensible objects
const $state = Symbol('proxyState') // ProxyState, accessible via get trap
const $ref = Symbol('ref') // marks objects excluded from proxying
const $snap = Symbol('snap') // snapshot cache on target
const $proxy = Symbol('proxy') // cached proxy on base object

type Path = (string | symbol)[]
type Op =
  | [op: 'set', path: Path, value: unknown, prevValue: unknown]
  | [op: 'delete', path: Path, prevValue: unknown]
type Listener = (op: Op | undefined, nextVersion: number) => void
type RemoveListener = () => void
type AddListener = (listener: Listener) => RemoveListener
type ProxyState = readonly [
  target: object,
  ensureVersion: (nextCheckVersion?: number) => number,
  addListener: AddListener,
]

// Monotonic counter — stateless across requests, safe for SSR
let globalVersion = 1

// Fallback for non-extensible objects (frozen snapshots, sealed configs).
// WeakMap keyed by object identity — no cross-request leakage.
const sealedProxyCache = new WeakMap<object, object>()
const sealedSnapCache = new WeakMap<object, [version: number, snap: unknown]>()

function canProxy(x: unknown): boolean {
  if (!isObject(x) || (x as any)[$ref]) return false
  if (Array.isArray(x)) return true
  const proto = Object.getPrototypeOf(x)
  return proto === Object.prototype || proto === null
}

function getProxyState(value: unknown): ProxyState | undefined {
  if (!isObject(value)) return undefined
  return (value as any)[$state] as ProxyState | undefined
}

function defineHidden(obj: object, sym: symbol, value: unknown, writable = false): void {
  if (Object.isExtensible(obj)) {
    Object.defineProperty(obj, sym, { value, writable, configurable: true })
  }
}

// --- snapshot ---
function createSnapshot<T extends object>(target: T, version: number): T {
  const extensible = Object.isExtensible(target)
  const cache = extensible
    ? ((target as any)[$snap] as [number, unknown] | undefined)
    : sealedSnapCache.get(target)
  if (cache?.[0] === version) {
    return cache[1] as T
  }
  const snap: any = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target))
  const cacheEntry: [number, unknown] = [version, snap]
  if (extensible) {
    if ($snap in (target as any)) {
      ;(target as any)[$snap] = cacheEntry
    } else {
      defineHidden(target, $snap, cacheEntry, true)
    }
  } else {
    sealedSnapCache.set(target, cacheEntry)
  }
  Reflect.ownKeys(target).forEach((key) => {
    if (key === $snap || key === $proxy) return
    if (Object.getOwnPropertyDescriptor(snap, key)) return
    const value = Reflect.get(target, key)
    const { enumerable } = Reflect.getOwnPropertyDescriptor(target, key) as PropertyDescriptor
    const desc: PropertyDescriptor = {
      value,
      enumerable: enumerable as boolean,
      configurable: true,
    }
    const childState = getProxyState(value)
    if (childState) {
      const [childTarget, childEnsureVersion] = childState
      desc.value = createSnapshot(childTarget, childEnsureVersion())
    }
    Object.defineProperty(snap, key, desc)
  })
  return Object.preventExtensions(snap)
}

// --- handler ---
function createHandler<T extends object>(
  proxyState: ProxyState,
  isInitializing: () => boolean,
  addPropListener: (prop: string | symbol, propValue: unknown) => void,
  removePropListener: (prop: string | symbol) => void,
  notifyUpdate: (op: Op | undefined) => void
): ProxyHandler<T> {
  return {
    get(target: T, prop: string | symbol, receiver: object) {
      if (prop === $state) return proxyState
      return Reflect.get(target, prop, receiver)
    },
    deleteProperty(target: T, prop: string | symbol) {
      const prevValue = Reflect.get(target, prop)
      removePropListener(prop)
      const deleted = Reflect.deleteProperty(target, prop)
      if (deleted) {
        notifyUpdate(['delete', [prop], prevValue])
      }
      return deleted
    },
    set(target: T, prop: string | symbol, value: any, receiver: object) {
      const hasPrevValue = !isInitializing() && Reflect.has(target, prop)
      const prevValue = Reflect.get(target, prop, receiver)
      const cachedProxy = isObject(value) && getCachedProxy(value)
      if (
        hasPrevValue &&
        (Object.is(prevValue, value) || (cachedProxy && Object.is(prevValue, cachedProxy)))
      ) {
        return true
      }
      removePropListener(prop)
      const nextValue = !getProxyState(value) && canProxy(value) ? proxyInner(value) : value
      addPropListener(prop, nextValue)
      Reflect.set(target, prop, nextValue, receiver)
      notifyUpdate(['set', [prop], value, prevValue])
      return true
    },
  }
}

function getCachedProxy(obj: object): object | undefined {
  if (Object.isExtensible(obj)) {
    return (obj as any)[$proxy] as object | undefined
  }
  return sealedProxyCache.get(obj)
}

// --- proxy core ---
function proxyInner<T extends object>(baseObject: T): T {
  if (!isObject(baseObject)) {
    throw new Error('object required')
  }
  const found = getCachedProxy(baseObject) as T | undefined
  if (found) {
    return found
  }
  let version = globalVersion
  const listeners = new Set<Listener>()
  const notifyUpdate = (op: Op | undefined, nextVersion = ++globalVersion) => {
    if (version !== nextVersion) {
      checkVersion = version = nextVersion
      listeners.forEach((listener) => listener(op, nextVersion))
    }
  }
  let checkVersion = version
  const ensureVersion = (nextCheckVersion = globalVersion) => {
    if (checkVersion !== nextCheckVersion) {
      checkVersion = nextCheckVersion
      propProxyStates.forEach(([propProxyState]) => {
        const propVersion = propProxyState[1](nextCheckVersion)
        if (propVersion > version) {
          version = propVersion
        }
      })
    }
    return version
  }
  const createPropListener =
    (prop: string | symbol): Listener =>
    (op, nextVersion) => {
      let newOp: Op | undefined
      if (op) {
        newOp = [...op]
        newOp[1] = [prop, ...(newOp[1] as Path)]
      }
      notifyUpdate(newOp, nextVersion)
    }
  const propProxyStates = new Map<string | symbol, readonly [ProxyState, RemoveListener?]>()
  const addPropListener = (prop: string | symbol, propValue: unknown) => {
    if (isObject(propValue) && (propValue as any)[$ref]) return
    const propProxyState = getProxyState(propValue)
    if (propProxyState) {
      if (listeners.size) {
        const remove = propProxyState[2](createPropListener(prop))
        propProxyStates.set(prop, [propProxyState, remove])
      } else {
        propProxyStates.set(prop, [propProxyState])
      }
    }
  }
  const removePropListener = (prop: string | symbol) => {
    const entry = propProxyStates.get(prop)
    if (entry) {
      propProxyStates.delete(prop)
      entry[1]?.()
    }
  }
  const addListener = (listener: Listener) => {
    listeners.add(listener)
    if (listeners.size === 1) {
      propProxyStates.forEach(([propProxyState, prevRemove], prop) => {
        if (prevRemove) return
        const remove = propProxyState[2](createPropListener(prop))
        propProxyStates.set(prop, [propProxyState, remove])
      })
    }
    const removeListener = () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        propProxyStates.forEach(([propProxyState, remove], prop) => {
          if (remove) {
            remove()
            propProxyStates.set(prop, [propProxyState])
          }
        })
      }
    }
    return removeListener
  }
  const proxyState: ProxyState = [baseObject, ensureVersion, addListener]
  let initializing = true
  const handler = createHandler<T>(
    proxyState,
    () => initializing,
    addPropListener,
    removePropListener,
    notifyUpdate
  )
  const proxyObject = new Proxy(baseObject, handler)
  if (Object.isExtensible(baseObject)) {
    defineHidden(baseObject, $proxy, proxyObject)
  } else {
    sealedProxyCache.set(baseObject, proxyObject)
  }
  Reflect.ownKeys(baseObject).forEach((key) => {
    if (key === $proxy) return
    const desc = Object.getOwnPropertyDescriptor(baseObject, key) as PropertyDescriptor
    if ('value' in desc && desc.writable) {
      proxyObject[key as keyof T] = baseObject[key as keyof T]
    }
  })
  initializing = false
  return proxyObject
}

// --- public API ---

export function createProxy<T extends object>(initialValue: T): T {
  return proxyInner(initialValue)
}

export function snapshot<T extends object>(state: T): T {
  const proxyState = getProxyState(state)
  if (!proxyState) {
    throw new Error('Please use proxy object')
  }
  const [target, ensureVersion] = proxyState
  return createSnapshot(target, ensureVersion()) as T
}

export function subscribe<T extends object>(state: T, callback: () => void): () => void {
  const proxyState = getProxyState(state)
  if (!proxyState) {
    throw new Error('Please use proxy object')
  }
  let promise: Promise<void> | undefined
  const addListener = proxyState[2]
  let isListenerActive = false
  const listener: Listener = () => {
    if (!promise) {
      promise = Promise.resolve().then(() => {
        promise = undefined
        if (isListenerActive) {
          callback()
        }
      })
    }
  }
  const removeListener = addListener(listener)
  isListenerActive = true
  return () => {
    isListenerActive = false
    removeListener()
  }
}

export function ref<T extends object>(obj: T): T {
  defineHidden(obj, $ref, true)
  return obj
}

/**
 * Convert a proxy (or any value) to a plain serializable object.
 * Unlike `snapshot()`, this works on non-proxy values too and does not freeze
 * the result — making it safe to pass directly to server actions.
 *
 * @example
 * ```ts
 * const todos = state(todoModel)
 * await saveTodo(toPlain(todos.items[0]))
 * ```
 */
export function toPlain<T>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object') return value
  return toPlainInner(value as object) as T
}

function toPlainInner(obj: object): object {
  // Unwrap proxy to its underlying target
  const ps = getProxyState(obj)
  const target = ps ? ps[0] : obj

  if (Array.isArray(target)) {
    return target.map((item) => {
      if (item === null || item === undefined || typeof item !== 'object') return item
      return toPlainInner(item)
    })
  }

  // Preserve native objects (Date, File, Blob, Map, Set, etc.)
  const proto = Object.getPrototypeOf(target)
  if (proto !== Object.prototype && proto !== null) return target

  const result: Record<string, unknown> = {}
  for (const key of Object.keys(target)) {
    const val = (target as Record<string, unknown>)[key]
    if (val === null || val === undefined || typeof val !== 'object') {
      result[key] = val
    } else {
      result[key] = toPlainInner(val as object)
    }
  }
  return result
}
