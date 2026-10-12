import {
  SERVER_FN_BASE_PATH,
  SERVER_FN_SSR_DISPATCH,
  parseServerFnWire,
  serverFnIdToPath,
  stringifyServerFnWire,
  type ServerFnResponse,
  type ServerFnSsrDispatch,
} from './protocol'

/** Client Component SSR이면 RSC graph가 등록한 같은 요청 scope dispatcher를 돌려준다. */
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
 * 컴파일된 API method 하나를 호출 함수로 만든다. 브라우저는 같은 origin POST를,
 * Client Component SSR(`.suspend()` queryFn)은 HTTP 왕복 없이 같은 요청 scope dispatcher를 쓴다.
 * 두 경로 모두 같은 wire 문자열을 파싱하므로 SSR 결과와 브라우저 결과의 모양이 같다.
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
