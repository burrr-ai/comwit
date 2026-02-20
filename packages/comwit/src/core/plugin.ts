import type { StoreEntry } from './model'

/**
 * Bag of data collected per-model during normalize().
 * Each plugin stores its own entries keyed by field path.
 */
export type PluginBag = Map<string, unknown>

/**
 * A FieldPlugin detects special descriptors in model initial state,
 * extracts them during normalize(), and hooks into the runtime lifecycle.
 */
export type FieldPlugin = {
  /** Unique plugin name (e.g. 'query', 'persist', 'realtime') */
  name: string

  /**
   * Called during model normalize() for each value in the initial state tree.
   * Return { initialValue, descriptor } if this plugin handles the value, or null to skip.
   */
  detect(value: unknown, path: string, bag: PluginBag): { initialValue: unknown } | null

  /**
   * Called once per provider to create plugin-level registry state.
   * For query plugin, this creates the QueryBindingRegistry.
   */
  createRegistryState(defaults?: Record<string, unknown>): unknown

  /**
   * Called when action's state() binds a model proxy.
   * Wraps the proxy with plugin-specific accessors (e.g. .query(), .refetch()).
   */
  bindState(
    proxy: object,
    bag: PluginBag,
    registryState: unknown,
    defaults?: Record<string, unknown>
  ): object

  /**
   * Called during useModel() render, after useSyncExternalStore.
   * Used by query plugin to throw promises for Suspense or errors for ErrorBoundary.
   */
  onRender?(bag: PluginBag, registryState: unknown): void
}

const plugins: FieldPlugin[] = []

export function registerPlugin(plugin: FieldPlugin): void {
  if (plugins.some((p) => p.name === plugin.name)) return
  plugins.push(plugin)
}

export function getPlugins(): readonly FieldPlugin[] {
  return plugins
}
