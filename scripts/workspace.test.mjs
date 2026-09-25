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

test('registry dependencies are real npm package names, never import examples from comments', () => {
  execFileSync(process.execPath, [join(root, 'packages/ui/cli/scripts/build-registry.mjs')])
  const index = JSON.parse(readFileSync(join(root, 'packages/ui/cli/registry/index.json'), 'utf8'))
  const npmName = /^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/
  for (const item of index.items)
    for (const dep of item.dependencies)
      assert.match(dep, npmName, `${item.name} lists a bogus dependency: ${dep}`)
  const toast = index.items.find((i) => i.name === 'toast')
  assert.ok(toast.dependencies.includes('sonner'))
  assert.ok(!toast.dependencies.some((d) => d.startsWith('@/')))
})

test('page-transition installs the route boundary that matches the detected router', () => {
  execFileSync(process.execPath, [join(root, 'packages/ui/cli/scripts/build-registry.mjs')])
  const fixture = mkdtempSync(join(tmpdir(), 'comwit-cli-router-'))
  try {
    mkdirSync(join(fixture, 'app'))
    writeFileSync(join(fixture, 'app/globals.css'), '@import "tailwindcss";\n')
    const setDeps = (deps) =>
      writeFileSync(join(fixture, 'package.json'), JSON.stringify({ private: true, ...deps }))
    const run = (...args) =>
      execFileSync(process.execPath, [cli, ...args, '--cwd', fixture, '--no-install'], {
        encoding: 'utf8',
      })
    const boundary = () => readFileSync(join(fixture, 'components/ui/route-boundary.tsx'), 'utf8')

    setDeps({ dependencies: { next: '16.2.7' } })
    run('init')
    const out = run('add', 'page-transition')
    assert.match(out, /route-boundary\.tsx.*nextjs/)
    assert.match(boundary(), /from ['"]next\/navigation['"]/)
    assert.match(boundary(), /from ['"]@\/components\/ui\/page-transition['"]/)
    const provider = readFileSync(join(fixture, 'components/ui/page-transition.tsx'), 'utf8')
    assert.match(provider, /from ['"]@ssgoi\/react['"]/)
    assert.doesNotMatch(out, /npm deps.*\bnext\b/)

    // React Router 6 projects only carry react-router-dom; the import follows the installed package.
    setDeps({ dependencies: { 'react-router-dom': '6.30.0' } })
    run('add', 'route-boundary', '--overwrite')
    assert.match(boundary(), /from ['"]react-router-dom['"]/)

    setDeps({ dependencies: { '@tanstack/react-router': '1.0.0' } })
    run('add', 'route-boundary', '--overwrite')
    assert.match(boundary(), /from ['"]@tanstack\/react-router['"]/)

    // No supported router → the prop-based boundary, and --router overrides detection.
    setDeps({})
    run('add', 'route-boundary', '--overwrite')
    assert.doesNotMatch(
      boundary(),
      /from ['"](next\/navigation|react-router|@tanstack\/react-router)['"]/
    )
    assert.match(boundary(), /path/)
    run('add', 'route-boundary', '--overwrite', '--router', 'nextjs')
    assert.match(boundary(), /from ['"]next\/navigation['"]/)
    assert.throws(() => run('add', 'route-boundary', '--overwrite', '--router', 'remix'))
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})

test('generated docs consume the moved registry and expose separate agent guides', () => {
  execFileSync(process.execPath, [join(root, 'apps/docs/scripts/gen-ui.mjs')])
  const catalog = readFileSync(join(root, 'apps/docs/app/ui/_generated/catalog.ts'), 'utf8')
  assert.match(catalog, /@\/components\/ui\/button/)
  assert.match(catalog, /npx comwit-ui add dialog/)
  assert.match(catalog, /npx comwit-ui add page-transition/)
  const ui = readFileSync(join(root, 'apps/docs/public/ui/llms.txt'), 'utf8')
  const state = readFileSync(join(root, 'apps/docs/public/state/llms.txt'), 'utf8')
  assert.match(ui, /comwit-ui@latest init/)
  assert.match(ui, /page-transition/)
  assert.match(state, /@comwit\/state/)
  assert.doesNotMatch(state, /library\.comwit\.io\/(docs|llm)\//)
})
