import {
  SERVER_FN_BASE_PATH,
  parseServerFnWire,
  serverFnIdToPath,
  stringifyServerFnWire,
  type ServerFnResponse,
} from './protocol'

/** 컴파일된 API method 하나를 같은 origin의 POST 호출 함수로 만든다. */
export function createServerFnClient(id: string) {
  return async (...args: unknown[]): Promise<unknown> => {
    const response = await fetch(`${SERVER_FN_BASE_PATH}/${serverFnIdToPath(id)}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: stringifyServerFnWire({ args }),
    })

    let payload: ServerFnResponse
    try {
      payload = parseServerFnWire<ServerFnResponse>(await response.text())
    } catch {
      throw new Error('서버 응답을 처리하지 못했어요')
    }

    if (!payload.ok) throw new Error(payload.error.message)
    if (!response.ok) throw new Error('서버 요청을 처리하지 못했어요')
    return payload.data
  }
}
