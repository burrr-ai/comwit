import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
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

test('src-dir projects: files land where the import alias points, lib siblings stay in lib', () => {
  execFileSync(process.execPath, [join(root, 'packages/ui/cli/scripts/build-registry.mjs')])
  const fixture = mkdtempSync(join(tmpdir(), 'comwit-cli-src-'))
  try {
    mkdirSync(join(fixture, 'src/app'), { recursive: true })
    writeFileSync(join(fixture, 'package.json'), '{"private":true}')
    writeFileSync(join(fixture, 'src/app/globals.css'), '@import "tailwindcss";\n')
    // tsconfig allows comments and trailing commas; "@/*" must survive comment stripping.
    writeFileSync(
      join(fixture, 'tsconfig.json'),
      '{\n  // paths\n  "compilerOptions": { "paths": { "@/*": ["./src/*"], }, /* x */ },\n}\n'
    )
    const run = (...args) =>
      execFileSync(process.execPath, [cli, ...args, '--cwd', fixture, '--no-install'], {
        encoding: 'utf8',
      })
    run('init')
    const config = JSON.parse(readFileSync(join(fixture, 'comwit.json'), 'utf8'))
    assert.equal(config.srcDir, 'src')
    assert.ok(existsSync(join(fixture, 'src/app/comwit-tokens.css')))

    // A project that keeps other helpers in lib/utils/ puts cn() beside them.
    config.aliases = { ...config.aliases, ui: 'lib/components/ui', utils: 'lib/utils/cn' }
    writeFileSync(join(fixture, 'comwit.json'), JSON.stringify(config))
    // Boolean flags never swallow the next word: `--overwrite popup` still installs popup.
    run('add', '--overwrite', 'popup')
    const read = (rel) => readFileSync(join(fixture, 'src', rel), 'utf8')
    assert.ok(!existsSync(join(fixture, 'lib')), 'nothing is written outside srcDir')
    assert.match(read('lib/utils/cn.ts'), /export function cn/)
    assert.match(read('lib/components/ui/button.tsx'), /from ['"]@\/lib\/utils\/cn['"]/)
    const popup = read('lib/popup.tsx')
    assert.match(popup, /from ['"]@\/lib\/overlay-motion['"]/)
    assert.match(popup, /from ['"]@\/lib\/components\/ui\/dialog['"]/)
    assert.ok(read('lib/overlay-motion.tsx').length)
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})

test('component text follows the project locale and declared packages keep their pins', () => {
  execFileSync(process.execPath, [join(root, 'packages/ui/cli/scripts/build-registry.mjs')])
  const fixture = mkdtempSync(join(tmpdir(), 'comwit-cli-locale-'))
  try {
    mkdirSync(join(fixture, 'app'))
    writeFileSync(
      join(fixture, 'package.json'),
      JSON.stringify({
        private: true,
        dependencies: { sonner: '2.0.7', 'lucide-react': '0.544.0' },
      })
    )
    writeFileSync(join(fixture, 'app/globals.css'), '@import "tailwindcss";\n')
    const run = (...args) =>
      execFileSync(process.execPath, [cli, ...args, '--cwd', fixture], { encoding: 'utf8' })
    run('init', '--locale', 'ko', '--no-install')
    assert.equal(JSON.parse(readFileSync(join(fixture, 'comwit.json'), 'utf8')).locale, 'ko')
    const out = run('add', 'date-picker', 'popup', '--no-install')
    assert.match(out, /lib\/ui-text\.ts.*\(ko\)/)
    const text = readFileSync(join(fixture, 'lib/ui-text.ts'), 'utf8')
    assert.match(text, /locale: 'ko-KR'/)
    assert.match(text, /날짜 선택/)
    assert.doesNotMatch(text, /^import /m)
    for (const file of ['components/ui/date-picker.tsx', 'lib/popup.tsx']) {
      const source = readFileSync(join(fixture, file), 'utf8')
      assert.match(source, /from ['"]@\/lib\/ui-text['"]/, `${file} reads its text from ui-text`)
      assert.doesNotMatch(
        source,
        /'Select date'|'Confirm'|'Cancel'/,
        `${file} has no inline English`
      )
    }
    // --locale on add wins over comwit.json; an unknown locale lists the available ones.
    run('add', 'ui-text', '--overwrite', '--locale', 'en', '--no-install')
    assert.match(readFileSync(join(fixture, 'lib/ui-text.ts'), 'utf8'), /locale: 'en-US'/)
    assert.throws(
      () => run('add', 'ui-text', '--overwrite', '--locale', 'xx', '--no-install'),
      /en · ko/
    )

    // Re-adding a declared package would move its pin (2.0.7 → ^latest), so only missing ones install.
    const dry = run('add', 'toast', '--dry')
    const install = dry.split('\n').find((line) => line.includes('$ npm install'))
    assert.ok(install, 'missing packages are installed')
    assert.match(install, /@comwit\/ui/)
    assert.doesNotMatch(install, /\bsonner\b|lucide-react/)
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})

test('every ui-text locale is complete and import-free', () => {
  const dir = join(root, 'packages/ui/templates/src/locales')
  const index = JSON.parse(readFileSync(join(root, 'packages/ui/cli/registry/index.json'), 'utf8'))
  const item = index.items.find((i) => i.name === 'ui-text')
  assert.equal(item.variantBy, 'locale')
  assert.deepEqual(item.variants, ['en', 'ko'])
  const keys = (source) => [...source.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]).sort()
  const en = readFileSync(join(root, 'packages/ui/templates/src/lib/ui-text.ts'), 'utf8')
  const ko = readFileSync(join(dir, 'ui-text.ko.ts'), 'utf8')
  assert.deepEqual(keys(ko), keys(en))
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

test('behavior lives in the engine: templates depend on @comwit/ui, not on engine libraries or hooks', () => {
  execFileSync(process.execPath, [join(root, 'packages/ui/cli/scripts/build-registry.mjs')])
  const index = JSON.parse(readFileSync(join(root, 'packages/ui/cli/registry/index.json'), 'utf8'))
  const core = JSON.parse(readFileSync(join(root, 'packages/ui/core/package.json'), 'utf8'))
  assert.ok(core.dependencies['react-virtuoso'], 'the engine owns react-virtuoso')
  for (const name of [
    'chat',
    'app-bar',
    'bottom-nav',
    'drag-scroller',
    'pull-to-refresh',
    'glass',
  ]) {
    const item = index.items.find((i) => i.name === name)
    assert.ok(item, `${name} is in the registry`)
    assert.ok(item.dependencies.includes('@comwit/ui'), `${name} depends on the engine`)
    assert.ok(
      !item.dependencies.includes('react-virtuoso'),
      `${name} does not install react-virtuoso`
    )
    assert.ok(
      !item.registryDependencies.some((d) => d.startsWith('use-')),
      `${name} installs no hook files`
    )
  }
  assert.ok(!index.items.some((i) => i.type === 'hook'), 'no hook items remain in the registry')
  const chat = index.items.find((i) => i.name === 'chat')
  for (const dep of ['button', 'glass', 'textarea', 'utils', 'interaction'])
    assert.ok(chat.registryDependencies.includes(dep), `chat depends on ${dep}`)

  const fixture = mkdtempSync(join(tmpdir(), 'comwit-cli-chat-'))
  try {
    mkdirSync(join(fixture, 'app'))
    writeFileSync(join(fixture, 'package.json'), '{"private":true}')
    writeFileSync(join(fixture, 'app/globals.css'), '@import "tailwindcss";\n')
    const run = (...args) =>
      execFileSync(process.execPath, [cli, ...args, '--cwd', fixture, '--no-install'], {
        encoding: 'utf8',
      })
    run('init')
    run('add', 'chat')
    const source = readFileSync(join(fixture, 'components/ui/chat.tsx'), 'utf8')
    assert.match(source, /from ['"]@comwit\/ui['"]/)
    assert.doesNotMatch(source, /from ['"]react-virtuoso['"]/)
    assert.match(source, /from ['"]@\/components\/ui\/glass['"]/)
    assert.match(source, /from ['"]@\/lib\/interaction['"]/)
    for (const part of ['ChatMessages', 'ChatBubble', 'ChatComposer', 'ChatScrollToBottom'])
      assert.match(source, new RegExp(`\\b${part}\\b`))
    for (const file of ['button', 'glass', 'textarea'])
      assert.ok(readFileSync(join(fixture, `components/ui/${file}.tsx`), 'utf8').length)
    // The app bar imports its scroll intent from the engine; nothing lands in hooks/.
    run('add', 'app-bar', 'bottom-nav')
    assert.match(
      readFileSync(join(fixture, 'components/ui/app-bar.tsx'), 'utf8'),
      /from ['"]@comwit\/ui['"]/
    )
    assert.ok(!existsSync(join(fixture, 'hooks')), 'no hooks directory is created')
    assert.throws(() => run('add', 'use-scroll-chrome'), /@comwit\/ui/)
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
  assert.match(catalog, /npx comwit-ui add chat/)
  const ui = readFileSync(join(root, 'apps/docs/public/ui/llms.txt'), 'utf8')
  const state = readFileSync(join(root, 'apps/docs/public/state/llms.txt'), 'utf8')
  assert.match(ui, /comwit-ui@latest init/)
  assert.doesNotMatch(ui, /\{\{components\}\}/)
  // The UI guide is install + catalog: every gallery component is listed by its CLI name, once.
  for (const name of [...catalog.matchAll(/"cli": "npx comwit-ui add ([\w-]+)"/g)].map((m) => m[1]))
    assert.equal(ui.split(`\n- ${name}: `).length, 2, `ui llms.txt lists ${name} once`)
  assert.doesNotMatch(ui, /@comwit\/state/)
  assert.match(state, /@comwit\/state/)
  assert.doesNotMatch(state, /library\.comwit\.io\/(docs|llm)\//)
})
