const PROXY_STATE = Symbol('proxy-state')

type ProxyState = {
  listeners: Set<() => void>
  version: number
  notifyScheduled: boolean
}

const proxyStateMap = new WeakMap<object, ProxyState>()

function canProxy(value: unknown): value is object {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null || Array.isArray(value)
}

export function createProxy<T extends object>(initialValue: T): T {
  const state: ProxyState = {
    listeners: new Set(),
    version: 0,
    notifyScheduled: false,
  }

  function scheduleNotify() {
    if (!state.notifyScheduled) {
      state.notifyScheduled = true
      Promise.resolve().then(() => {
        state.notifyScheduled = false
        state.version++
        for (const listener of state.listeners) {
          listener()
        }
      })
    }
  }

  function wrap(obj: any): any {
    if (!canProxy(obj)) return obj

    if (Object.isFrozen(obj)) {
      obj = Array.isArray(obj) ? [...obj] : { ...obj }
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (canProxy(obj[i])) obj[i] = wrap(obj[i])
      }
    } else {
      const record = obj as Record<string, unknown>
      for (const key of Object.keys(record)) {
        if (canProxy(record[key])) record[key] = wrap(record[key])
      }
    }

    const handler: ProxyHandler<any> = {
      get(target, prop, receiver) {
        if (prop === PROXY_STATE) return state
        return Reflect.get(target, prop, receiver)
      },
      set(target, prop, value, receiver) {
        const old = Reflect.get(target, prop, receiver)
        if (Object.is(old, value)) return true
        if (canProxy(value)) value = wrap(value)
        Reflect.set(target, prop, value)
        scheduleNotify()
        return true
      },
      deleteProperty(target, prop) {
        Reflect.deleteProperty(target, prop)
        scheduleNotify()
        return true
      },
    }

    const p = new Proxy(obj, handler)
    proxyStateMap.set(p, state)
    return p
  }

  return wrap(initialValue) as T
}

function deepClone(value: any): any {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(deepClone)
  if (!canProxy(value)) return value
  const record = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(record)) {
    out[key] = deepClone(record[key])
  }
  return out
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    Object.freeze(value)
    value.forEach(deepFreeze)
  } else if (canProxy(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as any)[key])
    }
  }
  return value
}

export function snapshot<T extends object>(state: T): T {
  return deepFreeze(deepClone(state)) as T
}

export function subscribe<T extends object>(state: T, listener: () => void): () => void {
  const proxyState = proxyStateMap.get(state)
  if (!proxyState) {
    throw new Error('[comwit] subscribe() called on a non-proxy object')
  }
  proxyState.listeners.add(listener)
  return () => {
    proxyState.listeners.delete(listener)
  }
}
