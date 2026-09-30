import 'server-only'

import { ActionError } from '@/lib/utils/action-error'
import {
  serverFnManifest,
  type ServerFnModuleLoader,
} from './manifest'
import {
  parseServerFnWire,
  serverFnPathToId,
  stringifyServerFnWire,
  type ServerFnFailure,
  type ServerFnSuccess,
} from './protocol'

const MAX_BODY_BYTES = 100 * 1024 * 1024
const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
} as const

type RequestBody = {
  args: unknown[]
}

function response(body: ServerFnSuccess | ServerFnFailure, status = 200): Response {
  return new Response(stringifyServerFnWire(body), {
    status,
    headers: RESPONSE_HEADERS,
  })
}

function requestIsSameOrigin(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false

  const origin = request.headers.get('origin')
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

async function readBody(request: Request): Promise<string> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new RangeError('payload-too-large')
  }

  if (!request.body) return ''

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new RangeError('payload-too-large')
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

function isRequestBody(value: unknown): value is RequestBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Partial<RequestBody>).args)
  )
}

/** 모든 createAction 호출을 처리하는 단일 POST Route Handler 구현. */
export async function handleServerFnPost(
  request: Request,
  segments: string[],
  manifest: Readonly<Record<string, ServerFnModuleLoader>> = serverFnManifest,
): Promise<Response> {
  if (!requestIsSameOrigin(request)) {
    return response(
      {
        ok: false,
        error: { type: 'internal', message: '허용되지 않은 요청이에요' },
      },
      403,
    )
  }

  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return response(
      {
        ok: false,
        error: { type: 'internal', message: '잘못된 요청 형식이에요' },
      },
      415,
    )
  }

  const id = serverFnPathToId(segments)
  const loadModule = id ? manifest[id] : undefined
  if (!id || !loadModule) {
    return response(
      {
        ok: false,
        error: { type: 'internal', message: '서버 함수를 찾을 수 없어요' },
      },
      404,
    )
  }

  let body: unknown
  try {
    body = parseServerFnWire(await readBody(request))
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400
    return response(
      {
        ok: false,
        error: { type: 'internal', message: '요청 본문을 읽지 못했어요' },
      },
      status,
    )
  }

  if (!isRequestBody(body)) {
    return response(
      {
        ok: false,
        error: { type: 'internal', message: '잘못된 요청 본문이에요' },
      },
      400,
    )
  }

  try {
    // 정적 manifest가 허용한 모듈만 import한다. 요청값으로 임의 파일을 import하지 않는다.
    const action = await loadModule()
    return response({ ok: true, data: await action(...body.args) })
  } catch (error) {
    if (error instanceof ActionError) {
      return response(
        {
          ok: false,
          error: { type: 'action', message: error.message },
        },
        400,
      )
    }

    console.error(`[server-fn] action failed: ${id}`, error)
    return response(
      {
        ok: false,
        error: { type: 'internal', message: '서버 요청을 처리하지 못했어요' },
      },
      500,
    )
  }
}
