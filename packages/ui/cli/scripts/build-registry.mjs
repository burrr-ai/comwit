// ─────────────────────────────────────────────────────────────────────────
// Comwit registry generator using its own format, independent of the shadcn schema.
// Read @comwit/ui-templates sources into packages/ui/cli/registry/.
// index.json lists item metadata: names, types, and dependencies.
// Each <name>.json contains the complete item, including file contents.
// comwit-ui bundles this registry for add commands; no shadcn CLI, schema, or components.json is used.
// ─────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url)) // packages/ui/cli/scripts
const tplSrc = join(here, '..', '..', 'templates', 'src') // packages/ui/templates/src
const outDir = join(here, '..', 'registry') // packages/ui/cli/registry

const IGNORE_NPM = new Set(['react', 'react-dom'])

// Framework dependencies used by router variants in src/routers/route-boundary.<variant>.tsx.
// Detected frameworks already exist in the consumer project; record them as framework metadata without installing them.
const ROUTER_VARIANTS = {
  nextjs: 'next',
  'react-router': 'react-router',
  'tanstack-router': '@tanstack/react-router',
  generic: null,
}

// Official SSGOI router adapters identify router variants even without a direct framework import.
const ROUTER_ADAPTERS = {
  '@ssgoi/react/nextjs': 'next',
  '@ssgoi/react/react-router': 'react-router',
  '@ssgoi/react/tanstack-router': '@tanstack/react-router',
}

// Implicit dependency pairs that must be installed together.
// page-transition installs with the detected router's route-boundary variant;
// router-adapter boundaries require the PageTransition/Ssgoi provider.
const EXTRA_REGISTRY_DEPS = {
  'page-transition': ['route-boundary'],
  'route-boundary': ['page-transition'],
}

function pkgName(spec) {
  if (spec.startsWith('@')) return spec.split('/').slice(0, 2).join('/')
  return spec.split('/')[0]
}
// Read actual import/export statements at line starts, excluding usage examples in comments.
// Treating an example alias as an npm dependency would produce an invalid pnpm add @/components command.
function parseImports(content) {
  const code = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments.
    .replace(/^[ \t]*\/\/.*$/gm, '') // Line comments.
  const specs = []
  const re = /^[ \t]*(?:import|export)\b[^;]*?from\s+["']([^"']+)["']/gm
  let m
  while ((m = re.exec(code))) if (!m[1].startsWith('@/')) specs.push(m[1])
  return specs
}

const items = []

// 1) components/ui/*.tsx → type "ui"
const uiDir = join(tplSrc, 'components', 'ui')
for (const file of readdirSync(uiDir).filter((f) => f.endsWith('.tsx'))) {
  const name = basename(file, '.tsx')
  const content = readFileSync(join(uiDir, file), 'utf8')
  const deps = new Set()
  const registryDeps = new Set()
  for (const s of parseImports(content)) {
    if (s.startsWith('./'))
      registryDeps.add(s.slice(2)) // Sibling UI components.
    else if (s.startsWith('../../lib/')) registryDeps.add(basename(s))
    else if (s.startsWith('../../hooks/')) registryDeps.add(basename(s))
    else if (s.startsWith('.')) continue
    else {
      const p = pkgName(s)
      if (!IGNORE_NPM.has(p)) deps.add(p)
    }
  }
  for (const extra of EXTRA_REGISTRY_DEPS[name] ?? []) registryDeps.add(extra)
  items.push({
    name,
    type: 'ui',
    dependencies: [...deps].sort(),
    registryDependencies: [...registryDeps].sort(),
    files: [{ path: `components/ui/${file}`, content }],
  })
}

// 1b. Group routers/<name>.<variant>.tsx into one UI item per name with router variants.
// files[0] is the generic fallback; comwit-ui add detects the framework in package.json
// (next, react-router, or @tanstack/react-router), or uses --router, to select variant contents.
// Variants import each other with suffixed names; registry dependencies use the base name and the CLI removes suffixes on installation.
const VARIANT_FILE = /^([a-z][a-z0-9-]*)\.(nextjs|react-router|tanstack-router|generic)\.tsx$/
function routerVariant(name, file) {
  const content = readFileSync(join(tplSrc, 'routers', file), 'utf8')
  const deps = new Set()
  const registryDeps = new Set(EXTRA_REGISTRY_DEPS[name] ?? [])
  let framework = null
  for (const s of parseImports(content)) {
    if (s.startsWith('../components/ui/')) registryDeps.add(s.split('/').pop())
    else if (s.startsWith('../lib/')) registryDeps.add(basename(s))
    else if (s.startsWith('./')) registryDeps.add(s.slice(2).replace(VARIANT_SUFFIX, ''))
    else if (s.startsWith('.')) continue
    else {
      if (ROUTER_ADAPTERS[s]) framework = ROUTER_ADAPTERS[s]
      const p = pkgName(s)
      if (IGNORE_NPM.has(p)) continue
      if (Object.values(ROUTER_VARIANTS).includes(p)) framework = p
      else deps.add(p)
    }
  }
  return {
    framework,
    dependencies: [...deps].sort(),
    registryDependencies: [...registryDeps].sort(),
    content,
  }
}
const VARIANT_SUFFIX = /\.(nextjs|react-router|tanstack-router|generic)$/
{
  const byName = new Map()
  for (const file of readdirSync(join(tplSrc, 'routers')).sort()) {
    const m = VARIANT_FILE.exec(file)
    if (!m) continue
    if (!byName.has(m[1])) byName.set(m[1], {})
    byName.get(m[1])[m[2]] = routerVariant(m[1], file)
  }
  for (const [name, variants] of byName) {
    for (const variant of Object.keys(ROUTER_VARIANTS)) {
      if (!variants[variant]) throw new Error(`routers/${name}.${variant}.tsx is missing`)
      if (variants[variant].framework !== ROUTER_VARIANTS[variant])
        throw new Error(
          `routers/${name}.${variant}.tsx: expected to import ${ROUTER_VARIANTS[variant]}`
        )
    }
    const generic = variants.generic
    items.push({
      name,
      type: 'ui',
      dependencies: generic.dependencies,
      registryDependencies: generic.registryDependencies,
      files: [{ path: `components/ui/${name}.tsx`, content: generic.content }],
      variantBy: 'router',
      variants,
    })
  }
}

// 2. Supporting lib/hooks files.
function fileItem(name, relPath, type) {
  const content = readFileSync(join(tplSrc, relPath), 'utf8')
  const deps = new Set()
  const registryDeps = new Set()
  for (const s of parseImports(content)) {
    if (s.startsWith('../components/ui/')) registryDeps.add(s.split('/').pop())
    else if (s.startsWith('./'))
      registryDeps.add(basename(s)) // Sibling library or hook.
    else if (s.startsWith('.')) continue
    else {
      const p = pkgName(s)
      if (!IGNORE_NPM.has(p)) deps.add(p)
    }
  }
  return {
    name,
    type,
    dependencies: [...deps].sort(),
    registryDependencies: [...registryDeps].sort(),
    files: [{ path: relPath, content }],
  }
}
// Each lib/* or hooks/* file is one item; package-only index.ts barrels are excluded.
// Behavior hooks such as useMobile and ScrollChrome live in @comwit/ui, so hooks/ may be empty.
for (const [dir, type] of [
  ['lib', 'lib'],
  ['hooks', 'hook'],
]) {
  if (!existsSync(join(tplSrc, dir))) continue
  for (const file of readdirSync(join(tplSrc, dir))
    .filter((f) => /\.tsx?$/.test(f))
    .sort()) {
    if (file.startsWith('index.')) continue
    items.push(fileItem(file.replace(/\.tsx?$/, ''), `${dir}/${file}`, type))
  }
}

// 2b. locales/ui-text.<locale>.ts supplies locale variants of lib/ui-text. files[0] defaults to English.
// Select through --locale or comwit.json. check-ui-text.ts verifies identical keys across locales.
{
  const item = items.find((i) => i.name === 'ui-text')
  if (!item) throw new Error('lib/ui-text.ts is missing')
  const variants = {
    en: { dependencies: [], registryDependencies: [], content: item.files[0].content },
  }
  for (const file of readdirSync(join(tplSrc, 'locales')).sort()) {
    const m = /^ui-text\.([a-z]{2}(?:-[A-Z]{2})?)\.ts$/.exec(file)
    if (!m) continue
    const content = readFileSync(join(tplSrc, 'locales', file), 'utf8')
    if (parseImports(content).length) throw new Error(`locales/${file}: must not import anything`)
    variants[m[1]] = { dependencies: [], registryDependencies: [], content }
  }
  item.variantBy = 'locale'
  item.variants = variants
}

// 3. Theme: ship the canonical globals.css token contract, including tokens, @theme, and base rules.
// comwit-ui init writes this file and imports it from the project's globals.css.
function buildThemeItem() {
  const css = readFileSync(join(tplSrc, 'styles', 'globals.css'), 'utf8')
  // @custom-variant dark precedes :root and must be retained for consumer dark: utilities.
  // Start at the first authored rule after Tailwind imports rather than at :root.
  const startIdx = [css.indexOf('@custom-variant'), css.indexOf(':root')]
    .filter((i) => i !== -1)
    .sort((a, b) => a - b)[0]
  const tokens =
    startIdx === undefined
      ? css
      : `/* comwit-ui design tokens (source: @comwit/ui-templates/styles.css). Retheme by changing values. */\n` +
        css.slice(startIdx)
  return {
    name: 'theme',
    type: 'theme',
    dependencies: ['tw-animate-css'],
    registryDependencies: [],
    files: [{ path: 'comwit-tokens.css', content: tokens }],
  }
}
items.push(buildThemeItem())

// 4. Write the index and individual items.
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
for (const it of items) {
  writeFileSync(join(outDir, `${it.name}.json`), JSON.stringify(it, null, 2))
}
const index = {
  name: 'comwit',
  homepage: 'https://github.com/burrr-ai/comwit',
  items: items.map(({ files, variants, ...meta }) =>
    variants ? { ...meta, variants: Object.keys(variants) } : meta
  ),
}
writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2))
console.log(
  `comwit registry: ${items.length} items → packages/ui/cli/registry/*.json (ui ${
    items.filter((i) => i.type === 'ui').length
  } · lib ${items.filter((i) => i.type === 'lib').length} · hook ${
    items.filter((i) => i.type === 'hook').length
  } · theme ${items.filter((i) => i.type === 'theme').length})`
)
