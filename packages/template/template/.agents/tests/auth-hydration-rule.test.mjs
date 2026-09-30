import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const root = resolve(import.meta.dirname, '../..')
const binary = join(dirname(require.resolve('oxlint/package.json')), 'bin/oxlint')
function lint(t, source) {
  const directory = mkdtempSync(join(tmpdir(), 'comwit auth lint '))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const config = join(directory, 'config.json')
  const file = join(directory, 'client.tsx')
  writeFileSync(config, JSON.stringify({ categories: { correctness: 'off' }, jsPlugins: [{ name: 'custom', specifier: join(root, 'eslint-rules/index.cjs') }], rules: { 'custom/auth-hydration-boundary': 'error' } }))
  writeFileSync(file, source)
  const result = spawnSync(process.execPath, [binary, '--config', config, '--format', 'json', file], { encoding: 'utf8', cwd: root })
  assert.ok(result.status === 0 || result.status === 1, result.stderr)
  return JSON.parse(result.stdout).diagnostics.filter(item => item.code?.includes('auth-hydration-boundary'))
}

const imported = "import { useUser } from '@/services/app/state/user';"
test('the adapter is accepted when reactive consumers live in a child', t => {
  assert.deepEqual(lint(t, `${imported}
function Layout({initialUser, children}) { useUser.hydrate({me:{data:initialUser}}); return <Child>{children}</Child> }
function Child({children}) { const user=useUser(s=>s.me.data); return <div>{user?.name}{children}</div> }`), [])
})

test('a subscriber in the same hydration component is rejected even when it only selects actions', t => {
  const errors = lint(t, `${imported}
function Layout({initialUser}) { useUser.hydrate({me:{data:initialUser}}); const actions=useUser(s=>s.actions); return null }`)
  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /logout can replay/)
})

test('aliased admin hooks are checked with either call order', t => {
  const errors = lint(t, `import { useAdminUser as useAccount } from '@/services/admin/state/user';
const Layout=({initialUser})=>{ const user=useAccount(s=>s.me.data); useAccount['hydrate']({me:{data:initialUser}}); return null }`)
  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /useAccount/)
})

for (const method of ['load', 'suspend']) {
  test(`basic auth cannot start with me.${method} in a selector`, t => {
    const errors = lint(t, `${imported} function Child(){ const user=useUser(s=>s.me.${method}()); return null }`)
    assert.equal(errors.length, 1)
    assert.match(errors[0].message, /server-hydrated user/)
  })
}

test('ordinary query loads and passive user selectors are not rejected', t => {
  assert.deepEqual(lint(t, `${imported}
import { useProject } from '@/services/app/state/project';
function Child(){ const user=useUser(s=>s.me.data); const projects=useProject(s=>s.list.load()); return null }`), [])
})
