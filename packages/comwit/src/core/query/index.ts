// Types
export type {
  PlaceholderData,
  QueryDefaultOptions,
  QueryQueryOptions,
  ResourceQueryOptions,
  ResourceContext,
  ResourceBaseState,
  ResourceSingleState,
  ResourceInfiniteState,
  ResourceResult,
  Query,
  QueryInfinite,
  AnyResourceDescriptor,
  ResourceDescriptorMap,
  BoundSingleResourceState,
  BoundInfiniteResourceState,
  BoundResourceState,
  SingleResourceBuilderOptions,
  InfiniteResourceBuilderOptions,
  SuspenseState,
  QueryBindingRegistry,
} from './types'

// Descriptor factory + helpers
export { query, isResourceDescriptor, keepPreviousData } from './descriptor'

// Accessor
export { createResourceAccessor, mergeResult } from './accessor'

// Binding
export { bindResourceState } from './bind'

// Registry
export { createQueryBindingRegistry } from './registry'

// Suspense
export { checkSuspense } from './suspense'

// Plugin (auto-registers on import)
export { queryPlugin, QUERY_PLUGIN_NAME } from './plugin'
