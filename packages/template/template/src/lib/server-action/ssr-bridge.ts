import 'server-only'

import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external.js'
import { executeServerFn } from './handler'
import { serverFnManifest } from './manifest'
import {
  SERVER_FN_SSR_DISPATCH,
  stringifyServerFnWire,
  type ServerFnSsrDispatch,
} from './protocol'

/**
 * `.suspend()` queryFn이 Client Component SSR에서 상대경로 fetch 대신 같은 요청 scope로
 * Server Function을 실행하도록 dispatcher를 등록한다. RSC graph에서만 action을 import할 수
 * 있어 루트 layout이 이 모듈을 side-effect import한다. 결과는 브라우저와 같은 wire 문자열이다.
 *
 * 실제 요청(`request`) 렌더에서만 실행한다. 빌드 prerender·dev 검증 렌더(`prerender-client`,
 * `validation-client`)에서는 Next가 cookies()/connection()을 막으므로 끝나지 않는 Promise로
 * 경계를 fallback에 남겨 요청 시점 렌더로 미룬다(Next 비공개 저장소, 업그레이드 때 검증).
 */
const dispatch: ServerFnSsrDispatch = async (id, args) => {
  if (workUnitAsyncStorage.getStore()?.type !== 'request') {
    return new Promise<never>(() => {})
  }
  const result = await executeServerFn(id, args, serverFnManifest)
  return stringifyServerFnWire(result.body)
}

;(globalThis as Record<symbol, unknown>)[SERVER_FN_SSR_DISPATCH] = dispatch
