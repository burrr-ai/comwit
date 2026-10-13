import {
  serverFnManifest,
  type ServerFnModuleLoader,
} from './manifest'

type ServerFnDefinitions = Readonly<Record<string, string>>

/**
 * Create the server/RSC/SSR API facade. Import manifest-allowed actions on demand
 * and invoke them directly without sending HTTP requests to our own Route Handler.
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
