import { model, useSearchParam, type SearchParamBinding, type ComwitProviderProps } from '../src'
// @ts-expect-error router adapters are internal
import { createBrowserRouterAdapter } from '../src'
// @ts-expect-error page-level bootstrap providers are not public API
import { ComwitRouterProvider } from '../src'
// @ts-expect-error manual snapshot serialization is not public API
import { createRouterSnapshot } from '../src'
// @ts-expect-error binding declarations are not public API
import { searchParamBinding } from '../src'

const domain = model({ thread: null as string | null, page: 1 })

function contracts() {
  const props: ComwitProviderProps = {
    children: null,
    context: { router: {} },
    getServerSearchParams: () => '?thread=one',
  }
  const unavailable: ComwitProviderProps = { children: null, getServerSearchParams: () => null }
  const asyncGetter: ComwitProviderProps = {
    children: null,
    // @ts-expect-error the server getter is synchronous
    getServerSearchParams: async () => '?thread=one',
  }
  // @ts-expect-error the Provider does not accept a public adapter
  const adapter: ComwitProviderProps = { children: null, router: {} }
  const binding: SearchParamBinding<string | null> = useSearchParam(domain, 'thread', {
    key: 'thread',
    defaultValue: null,
  })
  const accepted: boolean = binding.set('selected', {
    history: 'replace',
    ifRevision: binding.getSnapshot().revision,
  })
  // @ts-expect-error field values are inferred
  binding.set(42)
  // @ts-expect-error field names are checked
  useSearchParam(domain, 'missing', { key: 'thread', defaultValue: null })
  // @ts-expect-error non-string fields require codecs
  useSearchParam(domain, 'page', { key: 'page', defaultValue: 1 })
  useSearchParam(domain, 'page', {
    key: 'page',
    defaultValue: 1,
    parse: (raw) => Number(raw ?? 1),
    serialize: String,
  })
  void [props, unavailable, asyncGetter, adapter, accepted]
}
void contracts
