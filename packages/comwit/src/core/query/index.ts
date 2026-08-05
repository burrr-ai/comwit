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
  ResourceRealtimeState,
  ResourceResult,
  Query,
  QueryInfinite,
  QueryRealtime,
  ConnectionStatus,
  SubscribeCallbacks,
  AnyResourceDescriptor,
  ResourceDescriptorMap,
  BoundSingleResourceState,
  BoundInfiniteResourceState,
  BoundRealtimeResourceState,
  BoundResourceState,
  SelectableSingleResourceState,
  SelectableInfiniteResourceState,
  SelectableRealtimeResourceState,
  SelectableResourceState,
  SingleResourceBuilderOptions,
  InfiniteResourceBuilderOptions,
  RealtimeResourceBuilderOptions,
  SuspenseState,
  QueryBindingRegistry,
  DependentQueryOptions,
} from './types'

// Descriptor factory + helpers
export { query, isResourceDescriptor, keepPreviousData } from './descriptor'

// Accessor
export { createResourceAccessor, mergeResult, serializeQueryArg } from './accessor'

// React selector auto-load
export {
  createQuerySelectorState,
  runQuerySelectorLoads,
  querySelectorLoadKey,
  type QuerySelectorLoad,
} from './select'

// Binding
export { bindResourceState } from './bind'

// Registry
export { createQueryBindingRegistry } from './registry'

// Suspense
export { checkSuspense } from './suspense'

// Plugin (auto-registers on import)
export { queryPlugin, QUERY_PLUGIN_NAME } from './plugin'
