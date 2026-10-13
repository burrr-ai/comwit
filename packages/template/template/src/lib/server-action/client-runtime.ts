import { createServerFnClient } from './client'

/** Turn compiled function IDs into a POST-based client API object. */
export function resolveCompiledActions(
  definitions: Readonly<Record<string, string>>,
): Record<string, (...args: unknown[]) => Promise<unknown>> {
  const actions: Record<string, (...args: unknown[]) => Promise<unknown>> = {}

  for (const [name, id] of Object.entries(definitions)) {
    actions[name] = createServerFnClient(id)
  }

  return actions
}
