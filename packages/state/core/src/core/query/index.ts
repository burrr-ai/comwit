// Types
export type {
  PlaceholderData,
  QueryDefaultOptions,
  QueryQueryOptions,
  QueryHydrationEntries,
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
  commitQuerySelectorSuspenseLoads,
  prepareQuerySelectorSuspense,
  recordQuerySelectorSuspense,
  runQuerySelectorLoads,
  querySelectorLoadKey,
  type QuerySelectorLoad,
} from './select'

// Server → browser transport for render-resolved suspend results
export {
  createSuspendStream,
  escapeJsonForHtml,
  SUSPEND_STREAM_ATTRIBUTE,
  type StreamedSuspendEntry,
  type StreamedSuspendResult,
  type SuspendStream,
} from './stream'

// Binding
export { bindResourceState } from './bind'

// Registry
export { createQueryBindingRegistry } from './registry'

// Suspense
export { checkSuspense } from './suspense'

// Plugin (auto-registers on import)
export { queryPlugin, QUERY_PLUGIN_NAME } from './plugin'
