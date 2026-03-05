// Proxy-based reactivity engine
// Based on valtio (https://github.com/pmndrs/valtio) — MIT License
// Stripped of proxy-compare dependency, with built-in native-object exclusion

const isObject = (x: unknown): x is object => typeof x === 'object' && x !== null

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

// --- internal state ---
const proxyStateMap = new WeakMap<object, ProxyState>()
const refSet = new WeakSet<object>()
const snapCache = new WeakMap<object, [version: number, snap: unknown]>()
const versionHolder = [1] as [number]
const proxyCache = new WeakMap<object, object>()

// --- canProxy: only plain objects and arrays ---
function canProxy(x: unknown): boolean {
  if (!isObject(x) || refSet.has(x)) return false
  if (Array.isArray(x)) return true
  const proto = Object.getPrototypeOf(x)
  // Only proxy plain objects (prototype is Object.prototype or null)
  return proto === Object.prototype || proto === null
}

// --- snapshot ---
function createSnapshot<T extends object>(target: T, version: number): T {
  const cache = snapCache.get(target)
  if (cache?.[0] === version) {
    return cache[1] as T
  }
  const snap: any = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target))
  snapCache.set(target, [version, snap])
  Reflect.ownKeys(target).forEach((key) => {
    if (Object.getOwnPropertyDescriptor(snap, key)) {
      return
    }
    const value = Reflect.get(target, key)
    const { enumerable } = Reflect.getOwnPropertyDescriptor(target, key) as PropertyDescriptor
    const desc: PropertyDescriptor = {
      value,
      enumerable: enumerable as boolean,
      configurable: true,
    }
    if (proxyStateMap.has(value as object)) {
      const [target, ensureVersion] = proxyStateMap.get(value as object) as ProxyState
      desc.value = createSnapshot(target, ensureVersion())
    }
    Object.defineProperty(snap, key, desc)
  })
  return Object.preventExtensions(snap)
}

// --- handler ---
function createHandler<T extends object>(
  isInitializing: () => boolean,
  addPropListener: (prop: string | symbol, propValue: unknown) => void,
  removePropListener: (prop: string | symbol) => void,
  notifyUpdate: (op: Op | undefined) => void
): ProxyHandler<T> {
  return {
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
      if (
        hasPrevValue &&
        (Object.is(prevValue, value) ||
          (proxyCache.has(value) && Object.is(prevValue, proxyCache.get(value))))
      ) {
        return true
      }
      removePropListener(prop)
      const nextValue = !proxyStateMap.has(value) && canProxy(value) ? proxyInner(value) : value
      addPropListener(prop, nextValue)
      Reflect.set(target, prop, nextValue, receiver)
      notifyUpdate(['set', [prop], value, prevValue])
      return true
    },
  }
}

// --- proxy core ---
function proxyInner<T extends object>(baseObject: T): T {
  if (!isObject(baseObject)) {
    throw new Error('object required')
  }
  const found = proxyCache.get(baseObject) as T | undefined
  if (found) {
    return found
  }
  let version = versionHolder[0]
  const listeners = new Set<Listener>()
  const notifyUpdate = (op: Op | undefined, nextVersion = ++versionHolder[0]) => {
    if (version !== nextVersion) {
      checkVersion = version = nextVersion
      listeners.forEach((listener) => listener(op, nextVersion))
    }
  }
  let checkVersion = version
  const ensureVersion = (nextCheckVersion = versionHolder[0]) => {
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
    const propProxyState =
      !refSet.has(propValue as object) && proxyStateMap.get(propValue as object)
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
        if (prevRemove) {
          return
        }
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
  let initializing = true
  const handler = createHandler<T>(
    () => initializing,
    addPropListener,
    removePropListener,
    notifyUpdate
  )
  const proxyObject = new Proxy(baseObject, handler)
  proxyCache.set(baseObject, proxyObject)
  const proxyState: ProxyState = [baseObject, ensureVersion, addListener]
  proxyStateMap.set(proxyObject, proxyState)
  Reflect.ownKeys(baseObject).forEach((key) => {
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
  const proxyState = proxyStateMap.get(state)
  if (!proxyState) {
    throw new Error('Please use proxy object')
  }
  const [target, ensureVersion] = proxyState
  return createSnapshot(target, ensureVersion()) as T
}

export function subscribe<T extends object>(state: T, callback: () => void): () => void {
  const proxyState = proxyStateMap.get(state)
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
  refSet.add(obj)
  return obj
}
