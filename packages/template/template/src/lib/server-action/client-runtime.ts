import { createServerFnClient } from './client'

/** 컴파일된 함수 id를 POST 기반 client API 객체로 바꾼다. */
export function resolveCompiledActions(
  definitions: Readonly<Record<string, string>>,
): Record<string, (...args: unknown[]) => Promise<unknown>> {
  const actions: Record<string, (...args: unknown[]) => Promise<unknown>> = {}

  for (const [name, id] of Object.entries(definitions)) {
    actions[name] = createServerFnClient(id)
  }

  return actions
}
