/**
 * The manifest loader connected by withServerFn generates this module in memory.
 * Do not persist generated content, so adding/removing actions leaves the source tree clean.
 */
export type ServerFn = (...args: unknown[]) => Promise<unknown>
export type ServerFnModuleLoader = () => Promise<ServerFn>

export const serverFnManifest: Readonly<Record<string, ServerFnModuleLoader>> =
  Object.freeze({})
