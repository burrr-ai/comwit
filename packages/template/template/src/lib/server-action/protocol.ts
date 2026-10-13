/** Single internal HTTP endpoint for browser Server Function calls. */
export const SERVER_FN_BASE_PATH = '/api/internal/server-fn'

export type ServerFnSuccess = {
  ok: true
  data: unknown
}

export type ServerFnFailure = {
  ok: false
  error: {
    type: 'action' | 'internal'
    message: string
  }
}

export type ServerFnResponse = ServerFnSuccess | ServerFnFailure

const WIRE_TYPE = '__comwit_server_fn_wire_type__'
const UNDEFINED_VALUE = Symbol('server-fn-undefined')

type WireMarker = {
  [WIRE_TYPE]: 'undefined' | 'date' | 'bigint' | 'number'
  value?: string
}

/**
 * Tag only values JSON loses: undefined, Date, bigint, and non-finite numbers.
 * Everything else stays ordinary JSON, sharing one codec between Route Handler and browser.
 */
export function stringifyServerFnWire(value: unknown): string {
  return (
    JSON.stringify(value, function wireReplacer(key, serialized) {
      const original =
        key === '' ? value : (this as Record<string, unknown>)[key]

      if (original === undefined) {
        return { [WIRE_TYPE]: 'undefined' } satisfies WireMarker
      }
      if (original instanceof Date) {
        return {
          [WIRE_TYPE]: 'date',
          value: original.toISOString(),
        } satisfies WireMarker
      }
      if (typeof original === 'bigint') {
        return {
          [WIRE_TYPE]: 'bigint',
          value: original.toString(),
        } satisfies WireMarker
      }
      if (typeof original === 'number' && !Number.isFinite(original)) {
        return {
          [WIRE_TYPE]: 'number',
          value: String(original),
        } satisfies WireMarker
      }

      return serialized
    }) ?? '{"__comwit_server_fn_wire_type__":"undefined"}'
  )
}

/** Restore stringifyServerFnWire tags to their original JavaScript values. */
export function parseServerFnWire<T>(text: string): T {
  const parsed = JSON.parse(text, (_key, value: unknown) => {
    if (!isWireMarker(value)) return value

    switch (value[WIRE_TYPE]) {
      case 'undefined':
        return UNDEFINED_VALUE
      case 'date':
        return new Date(value.value ?? '')
      case 'bigint':
        return BigInt(value.value ?? '0')
      case 'number':
        if (value.value === 'NaN') return Number.NaN
        if (value.value === 'Infinity') return Number.POSITIVE_INFINITY
        if (value.value === '-Infinity') return Number.NEGATIVE_INFINITY
        return Number(value.value)
    }
  })

  return restoreUndefined(parsed) as T
}

/** Move the registry ID's #export suffix to the final URL segment. */
export function serverFnIdToPath(id: string): string {
  const separator = id.lastIndexOf('#')
  if (separator < 1 || separator === id.length - 1) {
    throw new Error(`Invalid Server Function id: ${id}`)
  }

  return `${id.slice(0, separator)}/${id.slice(separator + 1)}`
    .split('/')
    .map(encodeURIComponent)
    .join('/')
}

/** Restore catch-all Route Handler segments to a registry ID. */
export function serverFnPathToId(segments: string[]): string | null {
  if (segments.length < 2 || segments.some((segment) => !segment)) return null
  return `${segments.slice(0, -1).join('/')}#${segments.at(-1)}`
}

function isWireMarker(value: unknown): value is WireMarker {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const type = (value as Partial<WireMarker>)[WIRE_TYPE]
  return (
    type === 'undefined' ||
    type === 'date' ||
    type === 'bigint' ||
    type === 'number'
  )
}

function restoreUndefined(value: unknown): unknown {
  if (value === UNDEFINED_VALUE) return undefined
  if (Array.isArray(value)) return value.map(restoreUndefined)
  if (typeof value !== 'object' || value === null || value instanceof Date) {
    return value
  }

  const object = value as Record<string, unknown>
  for (const [key, child] of Object.entries(value)) {
    object[key] = restoreUndefined(child)
  }
  return value
}

/**
 * Global key for the in-process Client Component SSR dispatcher.
 * The RSC graph (ssr-bridge.ts) registers it; the SSR client facade reads it.
 */
export const SERVER_FN_SSR_DISPATCH = Symbol.for('comwit.server-fn.ssr-dispatch')

/** Dispatcher returning the response wire string without an HTTP round trip. */
export type ServerFnSsrDispatch = (id: string, args: unknown[]) => Promise<string>
