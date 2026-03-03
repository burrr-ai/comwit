import {
  proxy as valtioProxy,
  snapshot as valtioSnapshot,
  subscribe as valtioSubscribe,
  ref,
} from 'valtio'

const realProxyMap = new WeakMap<object, object>()

function needsRef(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  if (proto === Object.prototype || proto === null || Array.isArray(value)) return false
  return true
}

function autoRefDeep(obj: any): void {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (needsRef(obj[i])) obj[i] = ref(obj[i])
      else if (obj[i] !== null && typeof obj[i] === 'object') autoRefDeep(obj[i])
    }
  } else {
    for (const key of Object.keys(obj)) {
      if (needsRef(obj[key])) obj[key] = ref(obj[key])
      else if (obj[key] !== null && typeof obj[key] === 'object') autoRefDeep(obj[key])
    }
  }
}

const wrapCache = new WeakMap<object, object>()

function wrapWithAutoRef(target: any): any {
  if (wrapCache.has(target)) return wrapCache.get(target)

  const wrapped = new Proxy(target, {
    get(t, prop) {
      const value = Reflect.get(t, prop)
      if (
        typeof prop === 'string' &&
        value !== null &&
        typeof value === 'object' &&
        !needsRef(value)
      ) {
        return wrapWithAutoRef(value)
      }
      return value
    },
    set(t, prop, value) {
      if (needsRef(value)) {
        value = ref(value)
      } else if (value !== null && typeof value === 'object') {
        autoRefDeep(value)
      }
      return Reflect.set(t, prop, value)
    },
    deleteProperty(t, prop) {
      return Reflect.deleteProperty(t, prop)
    },
  })

  wrapCache.set(target, wrapped)
  realProxyMap.set(wrapped, target)
  return wrapped
}

export function createProxy<T extends object>(initialValue: T): T {
  autoRefDeep(initialValue)
  const p = valtioProxy(initialValue)
  return wrapWithAutoRef(p) as T
}

export function snapshot<T extends object>(state: T): T {
  const real = realProxyMap.get(state) || state
  return valtioSnapshot(real) as T
}

export function subscribe<T extends object>(state: T, listener: () => void): () => void {
  const real = realProxyMap.get(state) || state
  return valtioSubscribe(real, listener)
}
