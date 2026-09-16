import {
  model,
  useSearchParam,
  createBrowserRouterAdapter,
  type RouterAdapter,
  type SearchParamBinding,
} from '../src'

const domain = model({ thread: null as string | null, page: 1 })

function contracts() {
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
