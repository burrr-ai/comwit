import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { apiMocks } from '../../.storybook/api-mocks.mjs'

test('Storybook resolves every supported API import form to its browser mock', (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'storybook-api-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const mock = path.join(root, '.storybook/mocks/api/admin-user.ts')
  mkdirSync(path.dirname(mock), { recursive: true })
  writeFileSync(mock, 'export const adminUser = {}')
  const plugin = apiMocks(root)
  const importer = path.join(root, 'src/services/admin/state/user/model.ts')
  for (const source of [
    '@/services/admin/api/user',
    '../../api/user',
    '../../api/user/index.ts',
    path.join(root, 'src/services/admin/api/user'),
    `/@fs/${root}/src/services/admin/api/user/index.ts?import`,
  ]) {
    assert.equal(plugin.resolveId(source, importer), mock, source)
  }
  assert.throws(() => plugin.resolveId('@/services/admin/api/orders', importer), /API mock required/)
})

test('Storybook refuses server imports and unmocked authentication clients', () => {
  const root = path.resolve('/tmp/storybook-boundary-test')
  const plugin = apiMocks(root)
  const importer = path.join(root, 'src/services/admin/state/user/model.ts')
  for (const source of [
    '@/server/repository',
    '@/server/config',
    '@/services/admin/api/user/actions/get-me',
    '../../api/user/types',
    path.join(root, 'src/server/auth/admin.ts'),
  ]) {
    assert.throws(() => plugin.resolveId(source, importer), /Server implementation reached Storybook/, source)
  }
  assert.throws(() => plugin.resolveId('@/lib/auth-client/admin', importer), /auth mock required/)
  for (const source of ['react', '@/services/admin/state/user', '@/lib/components/ui/button']) {
    assert.equal(plugin.resolveId(source, importer), undefined, source)
  }
})
