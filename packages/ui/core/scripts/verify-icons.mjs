import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import * as icons from '../dist/icons/index.js'
import * as animated from '../dist/icons/animated.js'
import { iconCatalog } from '../dist/icons/catalog.js'

for (const { name } of iconCatalog) {
  assert.equal(typeof icons[`${name}Icon`], 'function', `static export: ${name}`)
  assert.ok(animated[`Animated${name}Icon`], `animated export: ${name}`)
}
const require = createRequire(import.meta.url)
assert.equal(typeof require('../dist/icons/index.cjs').BellIcon, 'function')
assert.ok(require('../dist/icons/animated.cjs').AnimatedBellIcon)
// The animated entry keeps its client boundary; the static entry and the primitives entry stay neutral.
assert.match(readFileSync('dist/icons/animated.js', 'utf8'), /^"use client"/)
assert.doesNotMatch(readFileSync('dist/icons/index.js', 'utf8'), /^"use client"/)
assert.doesNotMatch(readFileSync('dist/index.js', 'utf8'), /data-comwit-icon/)

async function bundle(name, entry) {
  const { outputFiles } = await build({
    stdin: {
      contents: `export { ${name} } from './dist/icons/${entry}.js'`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    minify: true,
    format: 'esm',
    external: ['react', 'react/*'],
  })
  return outputFiles[0].text
}
const still = await bundle('BellIcon', 'index')
const moving = await bundle('AnimatedBellIcon', 'animated')
for (const output of [still, moving]) {
  assert.doesNotMatch(
    output,
    /SlidersHorizontal|Rocket|Database/,
    'unused drawings should tree-shake'
  )
  assert.ok(output.length < 10_000, 'one icon must not retain the full collection')
}
assert.doesNotMatch(
  still,
  /keyframes|matchMedia|useEffect/,
  'static imports omit motion data and runtime'
)
const url = pathToFileURL(resolve('dist/icons/index.js')).href
execFileSync(
  process.execPath,
  [
    '--conditions=react-server',
    '--input-type=module',
    '-e',
    `
  import { BellIcon } from ${JSON.stringify(url)};
  const component = BellIcon({ size: 20 });
  if (component.type(component.props).type !== 'svg') throw new Error('Static RSC rendering failed');
`,
  ],
  { stdio: 'pipe' }
)
console.log(
  `@comwit/ui/icons checks passed: ${iconCatalog.length} exports, ESM/CJS/RSC, client boundary, primitives entry icon-free. Single Bell: ${still.length} bytes static / ${moving.length} bytes animated (minified, React external).`
)
