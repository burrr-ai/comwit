import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const cli = join(root, 'packages/ui/cli/src/index.js')

test('moved UI CLI installs usable sources and preserves consumer edits', () => {
  execFileSync(process.execPath, [join(root, 'packages/ui/cli/scripts/build-registry.mjs')])
  const fixture = mkdtempSync(join(tmpdir(), 'comwit-cli-'))
  try {
    mkdirSync(join(fixture, 'app'))
    writeFileSync(join(fixture, 'package.json'), '{"private":true}')
    writeFileSync(join(fixture, 'app/globals.css'), '@import "tailwindcss";\n')
    const run = (...args) =>
      execFileSync(process.execPath, [cli, ...args, '--cwd', fixture, '--no-install'], {
        encoding: 'utf8',
      })
    run('init')
    assert.match(
      readFileSync(join(fixture, 'app/globals.css'), 'utf8'),
      /@import "tailwindcss";[\s\S]*@import "\.\/comwit-tokens.css";/
    )
    assert.match(readFileSync(join(fixture, 'app/comwit-tokens.css'), 'utf8'), /--primary/)
    run('add', 'button', 'dialog')
    const button = join(fixture, 'components/ui/button.tsx')
    assert.match(readFileSync(button, 'utf8'), /from ['"]@comwit\/ui['"]/)
    assert.match(readFileSync(button, 'utf8'), /from ['"]@\/lib\/utils['"]/)
    assert.ok(readFileSync(join(fixture, 'lib/interaction.ts'), 'utf8').length)
    assert.ok(readFileSync(join(fixture, 'components/ui/dialog.tsx'), 'utf8').length)
    writeFileSync(button, '// locally customized\n')
    run('add', 'button')
    assert.equal(readFileSync(button, 'utf8'), '// locally customized\n')
    run('add', 'button', '--overwrite')
    assert.match(readFileSync(button, 'utf8'), /@comwit\/ui/)
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})

test('generated docs consume the moved registry and expose separate agent guides', () => {
  execFileSync(process.execPath, [join(root, 'apps/docs/scripts/gen-ui.mjs')])
  const catalog = readFileSync(join(root, 'apps/docs/app/ui/_generated/catalog.ts'), 'utf8')
  assert.match(catalog, /@\/components\/ui\/button/)
  assert.match(catalog, /npx comwit-ui add dialog/)
  const ui = readFileSync(join(root, 'apps/docs/public/ui/llms.txt'), 'utf8')
  const state = readFileSync(join(root, 'apps/docs/public/state/llms.txt'), 'utf8')
  assert.match(ui, /comwit-ui@latest init/)
  assert.match(state, /@comwit\/state/)
  assert.doesNotMatch(state, /library\.comwit\.io\/(docs|llm)\//)
})
