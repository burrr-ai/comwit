import { registerPlugin, type FieldPlugin, type PluginBag } from '../plugin'
import { isResourceDescriptor } from './descriptor'
import { bindResourceState } from './bind'
import { cancelModelGc, scheduleModelGc } from './accessor'
import { checkSuspense } from './suspense'
import { createQueryBindingRegistry } from './registry'
import type {
  AnyResourceDescriptor,
  QueryBindingRegistry,
  QueryDefaultOptions,
  ResourceDescriptorMap,
} from './types'
import type { LocalDefaults } from '../local'

export const QUERY_PLUGIN_NAME = 'query'

export const queryPlugin: FieldPlugin = {
  name: QUERY_PLUGIN_NAME,

  detect(value: unknown, path: string, bag: PluginBag) {
    if (!isResourceDescriptor(value)) return null
    if (!path) throw new Error('query() entry must be assigned to a model field')
    bag.set(path, value)
    return { initialValue: value.initialState }
  },

  createRegistryState(
    _defaults?: Record<string, unknown>,
    allDefaults?: Record<string, unknown>
  ): QueryBindingRegistry {
    return createQueryBindingRegistry(allDefaults?.local as LocalDefaults | undefined)
  },

  bindState(
    proxy: object,
    bag: PluginBag,
    registryState: unknown,
    defaults?: Record<string, unknown>,
    modelKey?: symbol
  ): object {
    if (bag.size === 0) return proxy
    const descriptors = bag as ResourceDescriptorMap
    return bindResourceState(
      proxy as any,
      descriptors,
      defaults as QueryDefaultOptions | undefined,
      registryState as QueryBindingRegistry,
      modelKey
    )
  },

  onRender(bag: PluginBag, registryState: unknown): void {
    if (bag.size === 0) return
    const descriptors = bag as ResourceDescriptorMap
    checkSuspense(descriptors, registryState as QueryBindingRegistry)
  },

  onSubscriberChange(
    modelKey: symbol,
    _bag: PluginBag,
    registryState: unknown,
    hasObservers: boolean
  ): void {
    const registry = registryState as QueryBindingRegistry
    if (hasObservers) {
      cancelModelGc(registry, modelKey)
    } else {
      scheduleModelGc(registry, modelKey)
    }
  },
}

// Registration is done explicitly by model.ts to avoid side-effect import issues
