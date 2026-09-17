import {
  action,
  create,
  model,
  searchParam,
  useModel,
  type ComwitProviderProps,
  type SearchParamSnapshot,
} from '../src'
// @ts-expect-error separate URL connection hooks are not public API
import { useSearchParam } from '../src'
// @ts-expect-error public router adapters are not required
import { createBrowserRouterAdapter } from '../src'

const domain = model({
  thread: searchParam({ key: 'thread' }),
  page: searchParam({ key: 'page', type: 'number', defaultValue: 1 }),
  enabled: searchParam({ key: 'enabled', type: 'boolean' }),
  tab: searchParam({ key: 'tab', defaultValue: 'overview' }),
  filters: { count: searchParam({ key: 'count', type: 'number' }) },
  settings: searchParam<{ tag: string }>({
    key: 'settings',
    parse: JSON.parse,
    serialize: JSON.stringify,
  }),
})
const actions = action(({ state }) => {
  const current = state(domain)
  const page: number = current.page
  const thread: string | null = current.thread
  const enabled: boolean | null = current.enabled
  const tab: string = current.tab
  const settings: { tag: string } | null = current.settings
  current.page = 2
  current.thread = 'two'
  current.enabled = false
  searchParam.set(current, 'page', 3, { history: 'push' })
  searchParam.set(current, 'filters.count', 4)
  const snapshot: SearchParamSnapshot<string | null> = searchParam.getSnapshot(current, 'thread')
  const accepted: boolean = searchParam.set(current, 'thread', 'three', {
    ifRevision: snapshot.revision,
  })
  // @ts-expect-error inferred numeric fields reject strings
  current.page = 'bad'
  // @ts-expect-error setter keeps the field type
  searchParam.set(current, 'page', 'bad')
  // @ts-expect-error unknown field paths are rejected
  searchParam.getSnapshot(current, 'missing')
  void [page, thread, enabled, tab, settings, accepted]
  return {}
})
const useDomain = create(domain, { actions: [actions] })
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
  const thread: string | null = useModel(domain, (s) => s.thread)
  const metadata: SearchParamSnapshot<number> = useDomain((s) => searchParam.getSnapshot(s, 'page'))
  useModel(domain, (s) => {
    // @ts-expect-error immutable selector snapshots cannot be used as action state
    searchParam.set(s, 'thread', 'bad')
    return s.thread
  })
  // @ts-expect-error explicit number defaults must be numeric
  searchParam({ key: 'bad', type: 'number', defaultValue: 'text' })
  // @ts-expect-error number decoding must be selected explicitly
  searchParam<number>({ key: 'bad', defaultValue: 1 })
  void [props, unavailable, asyncGetter, thread, metadata]
}
void contracts
