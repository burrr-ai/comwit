import React, { useState } from 'react'
import { createStoreRegistry, StoreRegistryProvider, useStoreRegistry } from './provider'
import {
  createBrowserRouterAdapter,
  type RouterAdapterFactory,
  type SearchParamDefinition,
} from './router'

export type ComwitRouterProviderProps = {
  children: React.ReactNode
  /** Serialized URL from the framework's server page/loader. Consumed only on mount. */
  initialSnapshot?: string | null
  /** Only these models get a private scope; other models keep their parent owners. */
  bindings: readonly SearchParamDefinition<any, any>[]
  /** Pure factory, called once per mounted scope (React may replay initialization). */
  createAdapter?: RouterAdapterFactory
}

/** A page-level URL scope that preserves the enclosing Provider's other models and context. */
export function ComwitRouterProvider({
  children,
  initialSnapshot,
  bindings,
  createAdapter = createBrowserRouterAdapter,
}: ComwitRouterProviderProps) {
  const parent = useStoreRegistry()
  const [registry] = useState(() => {
    const router = createAdapter({ initialSnapshot: initialSnapshot ?? null })
    const snapshot =
      initialSnapshot === undefined ? (router.getServerSnapshot?.() ?? null) : initialSnapshot
    const params =
      snapshot === null ? null : new URL(snapshot, 'https://comwit.invalid').searchParams
    const initialValues = new Map<symbol, Map<PropertyKey, unknown>>()
    const keys = new Set<string>()
    const fields = new Map<symbol, Set<PropertyKey>>()
    for (const { model, field, options } of bindings) {
      const values = initialValues.get(model.key) ?? new Map<PropertyKey, unknown>()
      const modelFields = fields.get(model.key) ?? new Set<PropertyKey>()
      if (keys.has(options.key) || modelFields.has(field)) {
        throw new Error('Router bootstrap bindings must have unique query keys and model fields')
      }
      for (const bag of model.pluginBags.values()) {
        for (const path of bag.keys()) {
          if (
            path === field ||
            path.startsWith(`${String(field)}.`) ||
            path.startsWith(`${String(field)}[`)
          ) {
            throw new Error('Router bootstrap bindings require plain model fields')
          }
        }
      }
      keys.add(options.key)
      modelFields.add(field)
      fields.set(model.key, modelFields)
      if (params !== null) {
        const raw = params.get(options.key)
        values.set(field, options.parse ? options.parse(raw) : (raw ?? options.defaultValue))
      }
      initialValues.set(model.key, values)
    }
    const scope = createStoreRegistry({ parent, router, initialValues })
    scope.searchParamBootstrap = { snapshot, bindings: [...bindings] }
    return scope
  })
  return <StoreRegistryProvider registry={registry}>{children}</StoreRegistryProvider>
}
