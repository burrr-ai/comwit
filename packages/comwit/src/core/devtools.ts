import { snapshot } from './proxy'
import type { Model, StoreEntry } from './model'

export type DevToolsEventType = 'state-change' | 'action' | 'query'

export type DevToolsEvent = {
  type: DevToolsEventType
  timestamp: number
  payload: unknown
}

export type ActionLogEntry = {
  name: string
  args: unknown[]
  result?: unknown
  error?: unknown
  timestamp: number
}

export type StoreInfo = {
  model: Model<any>
  entry: StoreEntry<any>
  unsubscribe: () => void
}

export type ComwitDevTools = {
  stores: Map<symbol, StoreInfo>
  getStoreSnapshot(model: Model<any>): { state: unknown; subscriberCount: number } | null
  actionLog: ActionLogEntry[]
  maxActionLogSize: number
  subscribe(type: DevToolsEventType, handler: (event: DevToolsEvent) => void): () => void
  _listeners: Map<DevToolsEventType, Set<(event: DevToolsEvent) => void>>
  _emit(type: DevToolsEventType, payload: unknown): void
  logAction(entry: ActionLogEntry): void
  registerStore(model: Model<any>, entry: StoreEntry<any>): void
}

declare global {
  var __COMWIT_DEVTOOLS__: ComwitDevTools | undefined
}

function createDevTools(maxLogSize = 50): ComwitDevTools {
  const stores = new Map<symbol, StoreInfo>()
  const actionLog: ActionLogEntry[] = []
  const listeners = new Map<DevToolsEventType, Set<(event: DevToolsEvent) => void>>()

  listeners.set('state-change', new Set())
  listeners.set('action', new Set())
  listeners.set('query', new Set())

  const devtools: ComwitDevTools = {
    stores,
    actionLog,
    maxActionLogSize: maxLogSize,
    _listeners: listeners,

    getStoreSnapshot(model: Model<any>) {
      const info = stores.get(model.key)
      if (!info) return null
      const state = info.entry.getSnapshot()
      return {
        state,
        subscriberCount: stores.size,
      }
    },

    subscribe(type: DevToolsEventType, handler: (event: DevToolsEvent) => void) {
      const set = listeners.get(type)
      if (!set) throw new Error(`[comwit devtools] Unknown event type: ${type}`)
      set.add(handler)
      return () => {
        set.delete(handler)
      }
    },

    _emit(type: DevToolsEventType, payload: unknown) {
      const event: DevToolsEvent = { type, timestamp: Date.now(), payload }
      const set = listeners.get(type)
      if (set) {
        for (const handler of set) {
          handler(event)
        }
      }
    },

    logAction(entry: ActionLogEntry) {
      actionLog.push(entry)
      while (actionLog.length > devtools.maxActionLogSize) {
        actionLog.shift()
      }
      devtools._emit('action', entry)
    },

    registerStore(model: Model<any>, entry: StoreEntry<any>) {
      if (stores.has(model.key)) return

      const unsubscribe = entry.subscribe(() => {
        devtools._emit('state-change', {
          modelKey: model.key,
          state: entry.getSnapshot(),
        })
      })

      stores.set(model.key, { model, entry, unsubscribe })
    },
  }

  return devtools
}

export function initDevTools(options?: { maxLogSize?: number }): ComwitDevTools | undefined {
  if (process.env.NODE_ENV === 'production') return undefined

  if (globalThis.__COMWIT_DEVTOOLS__) return globalThis.__COMWIT_DEVTOOLS__

  const devtools = createDevTools(options?.maxLogSize)
  globalThis.__COMWIT_DEVTOOLS__ = devtools
  return devtools
}

export function getDevTools(): ComwitDevTools | undefined {
  if (process.env.NODE_ENV === 'production') return undefined
  return globalThis.__COMWIT_DEVTOOLS__
}
