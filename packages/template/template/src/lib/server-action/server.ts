import {
  serverFnManifest,
  type ServerFnModuleLoader,
} from './manifest'

type ServerFnDefinitions = Readonly<Record<string, string>>

/**
 * 서버/RSC/SSR용 API facade를 만든다. 자기 Route Handler로 HTTP 요청하지 않고 manifest가
 * 허용한 action 모듈을 필요할 때 import해 원본 함수를 직접 실행한다.
 */
export function resolveCompiledActions(
  definitions: ServerFnDefinitions,
  manifest: Readonly<Record<string, ServerFnModuleLoader>> = serverFnManifest,
): Record<string, (...args: unknown[]) => Promise<unknown>> {
  const actions: Record<string, (...args: unknown[]) => Promise<unknown>> = {}

  for (const [name, id] of Object.entries(definitions)) {
    actions[name] = async (...args: unknown[]) => {
      const loadAction = manifest[id]
      if (!loadAction) throw new Error(`Unknown Server Function: ${id}`)
      const action = await loadAction()
      return action(...args)
    }
  }

  return actions
}
