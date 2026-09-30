/**
 * 실제 내용은 withServerFn이 연결한 manifest loader가 메모리에서 생성한다.
 * 파일 자체는 생성 결과를 저장하지 않으므로 액션 추가·삭제가 소스 트리를 더럽히지 않는다.
 */
export type ServerFn = (...args: unknown[]) => Promise<unknown>
export type ServerFnModuleLoader = () => Promise<ServerFn>

export const serverFnManifest: Readonly<Record<string, ServerFnModuleLoader>> =
  Object.freeze({})
