import {
  model,
  useSearchParam,
  createBrowserRouterAdapter,
  type RouterAdapter,
  type SearchParamBinding,
  ComwitRouterProvider,
  createRouterSnapshot,
  searchParamBinding,
  type RouterAdapterFactory,
  type ComwitRouterProviderProps,
} from '../src'
import { createRouterSnapshot as createServerSnapshot } from '../src/router-snapshot'

const domain = model({ thread: null as string | null, page: 1 })

function contracts() {
  const definition = searchParamBinding(domain, 'thread', { key: 'thread', defaultValue: null })
  const bootstrapped: SearchParamBinding<string | null> = useSearchParam(definition)
  // @ts-expect-error the definition preserves the field's value type
  bootstrapped.set(123)
  const createAdapter: RouterAdapterFactory = createBrowserRouterAdapter
  const bootstrapProps: ComwitRouterProviderProps = {
    children: null,
    initialSnapshot: createServerSnapshot({
      pathname: '/chat',
      searchParams: { thread: 'one', tags: ['a', 'b'] },
    }),
    bindings: [definition],
    createAdapter,
  }
  void bootstrapProps
  void ComwitRouterProvider
  void createRouterSnapshot
  const binding: SearchParamBinding<string | null> = useSearchParam(domain, 'thread', {
    key: 'thread',
    defaultValue: null,
  })
  const accepted: boolean = binding.set('selected', {
    history: 'replace',
    ifRevision: binding.getSnapshot().revision,
  })
  void accepted
  // @ts-expect-error values must match the selected model field
  binding.set(42)
  // @ts-expect-error field names are checked
  useSearchParam(domain, 'unknown', { key: 'thread', defaultValue: null })
  // @ts-expect-error a number field requires a codec
  useSearchParam(domain, 'page', { key: 'page', defaultValue: 1 })
  useSearchParam(domain, 'page', {
    key: 'page',
    defaultValue: 1,
    parse: (raw) => Number(raw ?? 1),
    serialize: (value) => String(value),
  })
  const adapter: RouterAdapter = createBrowserRouterAdapter()
  adapter.navigate('/chat?thread=one', { history: 'push' })
  // @ts-expect-error history only supports push/replace
  adapter.navigate('/chat', { history: 'back' })
}

void contracts
