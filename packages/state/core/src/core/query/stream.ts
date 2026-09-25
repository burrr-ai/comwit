import type { QueryCacheKey } from './types'

/** One `.suspend()` result resolved during server rendering, keyed by the selecting hook. */
export type StreamedSuspendEntry = {
  /** `useId()` of the `useModel()` call that selected the key; stable across SSR and hydration. */
  id: string
  path: string
  key: QueryCacheKey
  fetchedAt: number
  result: unknown
}

export type StreamedSuspendResult = {
  fetchedAt: number
  result: unknown
}

/**
 * Provider-scoped transport that carries render-resolved `.suspend()` results from the server
 * HTML stream into the browser key cache. The server side queues entries and drains them into an
 * inert JSON script; the browser side reads those scripts from the document on demand.
 */
export type SuspendStream = {
  /** Server: queue a render-resolved result for the next HTML flush. No-op in the browser. */
  record(entry: StreamedSuspendEntry): void
  /** Server: drain queued entries as HTML-safe JSON, or null when nothing is pending. */
  flush(): string | null
  /** Browser: claim the streamed result for one hook, field path and key. No-op on the server. */
  take(id: string, path: string, key: QueryCacheKey): StreamedSuspendResult | undefined
}

export const SUSPEND_STREAM_ATTRIBUTE = 'data-comwit-suspend'

type WireEntry = { i: string; p: string; k: string; t: number; r?: unknown }

/** Escape serialized JSON so it can be embedded inside an HTML script element. */
export function escapeJsonForHtml(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function compoundKey(id: string, path: string, key: QueryCacheKey): string {
  return `${id}\u0000${path}\u0000${key}`
}

function isWireEntry(value: unknown): value is WireEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as WireEntry).i === 'string' &&
    typeof (value as WireEntry).p === 'string' &&
    typeof (value as WireEntry).k === 'string'
  )
}

export function createSuspendStream(scope: string, server: boolean): SuspendStream {
  if (server) {
    const queue: WireEntry[] = []
    const recorded = new Set<string>()
    return {
      record(entry) {
        const compound = compoundKey(entry.id, entry.path, entry.key)
        if (recorded.has(compound)) return
        recorded.add(compound)
        const wire: WireEntry = { i: entry.id, p: entry.path, k: entry.key, t: entry.fetchedAt }
        // JSON drops undefined members; the browser side distinguishes a missing `r`.
        if (entry.result !== undefined) wire.r = entry.result
        queue.push(wire)
      },
      flush() {
        if (queue.length === 0) return null
        return escapeJsonForHtml(JSON.stringify(queue.splice(0)))
      },
      take: () => undefined,
    }
  }

  const entries = new Map<string, StreamedSuspendResult>()
  // Scripts are left in place: removing document nodes while React walks siblings during
  // hydration could break its cursor, and they are inert JSON.
  const consumed = new WeakSet<Element>()

  const scan = () => {
    if (typeof document === 'undefined') return
    const scripts = document.querySelectorAll(`script[${SUSPEND_STREAM_ATTRIBUTE}]`)
    for (const script of scripts) {
      if (consumed.has(script) || script.getAttribute(SUSPEND_STREAM_ATTRIBUTE) !== scope) continue
      consumed.add(script)
      let parsed: unknown
      try {
        parsed = JSON.parse(script.textContent ?? '')
      } catch {
        continue
      }
      if (!Array.isArray(parsed)) continue
      for (const wire of parsed) {
        if (!isWireEntry(wire)) continue
        entries.set(compoundKey(wire.i, wire.p, wire.k), {
          fetchedAt: typeof wire.t === 'number' ? wire.t : Date.now(),
          result: 'r' in wire ? wire.r : undefined,
        })
      }
    }
  }

  return {
    record() {},
    flush: () => null,
    take(id, path, key) {
      const compound = compoundKey(id, path, key)
      // Later Suspense boundaries stream their scripts after this provider mounted, so a miss
      // rescans the document before giving up.
      if (!entries.has(compound)) scan()
      const entry = entries.get(compound)
      if (entry) entries.delete(compound)
      return entry
    },
  }
}
