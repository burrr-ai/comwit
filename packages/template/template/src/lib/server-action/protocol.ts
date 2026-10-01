/** 브라우저가 Server Function을 호출하는 단일 내부 HTTP 경로. */
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
 * JSON이 잃어버리는 undefined/Date/bigint/비유한 숫자만 태그해서 보존한다.
 * 나머지는 평범한 JSON이라 Route Handler와 브라우저 양쪽에서 같은 코덱을 쓸 수 있다.
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

/** stringifyServerFnWire의 태그를 원래 JavaScript 값으로 복원한다. */
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

/** registry id의 #export 부분을 마지막 URL segment로 옮긴다. */
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

/** catch-all Route Handler의 segments를 registry id로 복원한다. */
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
