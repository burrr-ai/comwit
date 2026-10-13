import {
  SERVER_FN_BASE_PATH,
  SERVER_FN_SSR_DISPATCH,
  parseServerFnWire,
  serverFnIdToPath,
  stringifyServerFnWire,
  type ServerFnResponse,
  type ServerFnSsrDispatch,
} from './protocol'

/** During Client Component SSR, return the request-scoped dispatcher registered by the RSC graph. */
function ssrDispatch(): ServerFnSsrDispatch | undefined {
  if (typeof window !== 'undefined') return undefined
  return (globalThis as Record<symbol, ServerFnSsrDispatch | undefined>)[
    SERVER_FN_SSR_DISPATCH
  ]
}

async function postServerFn(id: string, args: unknown[]): Promise<string> {
  const response = await fetch(`${SERVER_FN_BASE_PATH}/${serverFnIdToPath(id)}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: stringifyServerFnWire({ args }),
  })
  return response.text()
}

/**
 * Create a callable compiled API method. Browsers use same-origin POST;
 * Client Component SSR (.suspend() queryFn) uses the same request-scoped dispatcher without HTTP.
 * Both parse the same wire string, so SSR and browser results have identical shapes.
 */
export function createServerFnClient(id: string) {
  return async (...args: unknown[]): Promise<unknown> => {
    const dispatch = ssrDispatch()
    const text = dispatch
      ? await dispatch(id, args)
      : await postServerFn(id, args)

    let payload: ServerFnResponse
    try {
      payload = parseServerFnWire<ServerFnResponse>(text)
    } catch {
      throw new Error('서버 응답을 처리하지 못했어요')
    }

    if (!payload.ok) throw new Error(payload.error.message)
    return payload.data
  }
}
