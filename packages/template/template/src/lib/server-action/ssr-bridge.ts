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
 * Register a dispatcher so Client Component SSR .suspend() queryFn runs Server Functions
 * in the same request scope instead of using relative fetch. Only the RSC graph can
 * import actions, so the root layout imports this module for its side effect.
 * Return the same wire string as browsers.
 *
 * Execute only for request renders. During build prerender/dev validation
 * (prerender-client, validation-client), Next blocks cookies()/connection().
 * Leave the boundary in fallback with a never-resolving Promise and defer to request time.
 * This uses private Next storage; verify it on upgrades.
 */
const dispatch: ServerFnSsrDispatch = async (id, args) => {
  if (workUnitAsyncStorage.getStore()?.type !== 'request') {
    return new Promise<never>(() => {})
  }
  const result = await executeServerFn(id, args, serverFnManifest)
  return stringifyServerFnWire(result.body)
}

;(globalThis as Record<symbol, unknown>)[SERVER_FN_SSR_DISPATCH] = dispatch
