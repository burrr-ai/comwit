#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// CLI for installing editable styled components into a project, using the @comwit/ui engine.
// comwit-ui init: configure comwit.json and connect the token contract.
// comwit-ui add <name...>: install components, registryDependencies, and npm dependencies.
// comwit-ui list: show available components.
//
// Read the bundled Comwit registry without shadcn tooling or external CLI dependencies; use Node built-ins only.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url)) // packages/cli/src
const REGISTRY_DIR = join(HERE, '..', 'registry')

// ── tiny ansi ─────────────────────────────────────────────────────────────
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
}
const log = (...a) => console.log(...a)
const die = (msg) => {
  console.error(c.red('✖ ') + msg)
  process.exit(1)
}

// ── args ────────────────────────────────────────────────────────────────
// Only value-taking flags consume the next argument, so --overwrite add button does not consume add as a flag value.
const VALUE_FLAGS = new Set(['cwd', 'css', 'router', 'locale'])
function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (VALUE_FLAGS.has(key) && next && !next.startsWith('--')) {
        flags[key] = next
        i++
      } else flags[key] = true
    } else positional.push(a)
  }
  return { positional, flags }
}

// ── registry ──────────────────────────────────────────────────────────────
function loadIndex() {
  return JSON.parse(readFileSync(join(REGISTRY_DIR, 'index.json'), 'utf8'))
}
// Map old names to current role-based template names rather than engine brands.
const ALIASES = { sonner: 'toast' }
// Behavior hooks are exported by @comwit/ui and have no source files to copy.
const MOVED_TO_ENGINE = {
  'use-mobile': 'useMobile · useMobileDevice',
  'use-scroll-chrome': 'ScrollChromeProvider · useScrollChrome',
}
function canonical(name) {
  const to = ALIASES[name]
  if (to) log(c.dim(`  '${name}' is now '${to}'.`))
  return to ?? name
}
function loadItem(name) {
  const p = join(REGISTRY_DIR, `${name}.json`)
  if (!existsSync(p)) {
    if (MOVED_TO_ENGINE[name])
      die(
        `'${name}' is now exported by @comwit/ui — import { ${MOVED_TO_ENGINE[name].replace(/ · /g, ', ')} } from '@comwit/ui'. There is no file to copy.`
      )
    die(`'${name}' is not in the registry. Run \`comwit-ui list\` to see available components.`)
  }
  return JSON.parse(readFileSync(p, 'utf8'))
}
/** Resolve registryDependencies recursively, deduplicate, and topologically order dependencies first. */
function resolveItems(names) {
  const seen = new Set()
  const ordered = []
  const visit = (raw) => {
    const name = canonical(raw)
    if (seen.has(name)) return
    seen.add(name)
    const item = loadItem(name)
    for (const dep of item.registryDependencies || []) visit(dep)
    ordered.push(item)
  }
  for (const n of names) visit(n)
  return ordered
}

// ── config (comwit.json) ────────────────────────────────────────────────
// Aliases append to importAlias (@/ plus components/ui). Files live beneath srcDir,
// the directory mapped by importAlias; @/* to ./src/* means srcDir is src.
// aliases.utils points to cn() without an extension; default to <lib>/utils.
const DEFAULT_CONFIG = {
  aliases: { ui: 'components/ui', lib: 'lib', hooks: 'hooks' },
  css: 'app/globals.css',
  importAlias: '@/',
}
function configPath(cwd) {
  return join(cwd, 'comwit.json')
}
function readConfig(cwd) {
  const p = configPath(cwd)
  if (!existsSync(p)) die('comwit.json is missing. Run `comwit-ui init` first.')
  const raw = JSON.parse(readFileSync(p, 'utf8'))
  const cfg = { ...DEFAULT_CONFIG, ...raw, aliases: { ...DEFAULT_CONFIG.aliases, ...raw.aliases } }
  cfg.srcDir ??= detectSrcDir(cwd, cfg.importAlias)
  return cfg
}
function utilsAlias(cfg) {
  return cfg.aliases.utils ?? `${cfg.aliases.lib}/utils`
}

// Read the importAlias directory from tsconfig/jsconfig paths, for example @/* to ./src/*.
// Fall back to the project root; comwit.json can specify srcDir explicitly.
function detectSrcDir(cwd, importAlias) {
  for (const file of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(cwd, file)
    if (!existsSync(p)) continue
    let json
    try {
      // Support comments and trailing commas in tsconfig while skipping strings so wildcard aliases remain intact.
      const text = readFileSync(p, 'utf8')
        .replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, str) => str ?? '')
        .replace(/,(\s*[}\]])/g, '$1')
      json = JSON.parse(text)
    } catch {
      continue
    }
    const opts = json.compilerOptions ?? {}
    const target = opts.paths?.[`${importAlias}*`]?.[0]
    if (typeof target !== 'string' || !target.endsWith('/*')) continue
    const base = join(opts.baseUrl ?? '.', target.slice(0, -2))
    return base === '.' ? '' : base.replace(/^\.\//, '')
  }
  return ''
}

// Rewrite import paths.
// Convert relative template imports to consumer aliases. Use the registry filePath
// to distinguish sibling UI components from sibling library files.
// Map ../../lib/X through the lib alias (utils uses aliases.utils), and ../../hooks/X through the hooks alias.
// Map ./X within components/ui to the UI alias and within lib to the library alias.
const VARIANT_SUFFIX = /\.(nextjs|react-router|tanstack-router|generic)$/
function rewriteImports(content, cfg, filePath) {
  const { importAlias: A, aliases } = cfg
  const lib = (rest) => (rest === 'utils' ? utilsAlias(cfg) : `${aliases.lib}/${rest}`)
  const sibling = filePath.startsWith('lib/') ? lib : (rest) => `${aliases.ui}/${rest}`
  return content.replace(/(from\s+|import\s+)(["'])([^"']+)\2/g, (m, kw, q, spec) => {
    let mapped = null
    if (spec.startsWith('../../lib/')) mapped = lib(spec.slice('../../lib/'.length))
    else if (spec.startsWith('../lib/')) mapped = lib(spec.slice('../lib/'.length))
    else if (spec.startsWith('../../hooks/'))
      mapped = `${aliases.hooks}/${spec.slice('../../hooks/'.length)}`
    else if (spec.startsWith('../hooks/'))
      mapped = `${aliases.hooks}/${spec.slice('../hooks/'.length)}`
    else if (spec === '../../hooks' || spec === '../hooks') mapped = `${aliases.hooks}/use-mobile`
    else if (spec.startsWith('../components/ui/'))
      mapped = `${aliases.ui}/${spec.slice('../components/ui/'.length)}`
    // Router variants import suffixed siblings such as ./tab-bar.nextjs; installed files use unsuffixed names.
    else if (spec.startsWith('./')) mapped = sibling(spec.slice(2).replace(VARIANT_SUFFIX, ''))
    if (!mapped) return m // Leave @comwit/ui, npm, and React imports unchanged.
    return `${kw}${q}${A}${mapped}${q}`
  })
}

// Map registry paths to project-relative destinations.
// Place source below srcDir, where importAlias points; place token CSS beside cfg.css.
function targetPath(filePath, cfg) {
  const src = (rel) => join(cfg.srcDir ?? '', rel)
  if (filePath.startsWith('components/ui/'))
    return src(join(cfg.aliases.ui, filePath.slice('components/ui/'.length)))
  if (filePath === 'lib/utils.ts') return src(`${utilsAlias(cfg)}.ts`)
  if (filePath.startsWith('lib/')) return src(join(cfg.aliases.lib, filePath.slice('lib/'.length)))
  if (filePath.startsWith('hooks/'))
    return src(join(cfg.aliases.hooks, filePath.slice('hooks/'.length)))
  if (filePath.endsWith('.css')) return join(dirname(cfg.css), filePath) // Token CSS lives beside globals.css.
  return filePath
}

function writeFileSafe(abs, content, { overwrite, dry }) {
  const existed = existsSync(abs)
  if (existed && !overwrite) return 'skip'
  if (!dry) {
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content)
  }
  return existed ? 'overwrite' : 'write'
}

// Detect the router to select a route-boundary variant.
// Variant names match registry keys: nextjs, react-router, tanstack-router, and generic.
const ROUTER_PACKAGES = [
  ['nextjs', ['next']],
  ['tanstack-router', ['@tanstack/react-router']],
  ['react-router', ['react-router', 'react-router-dom']],
]
function projectDeps(cwd) {
  const p = join(cwd, 'package.json')
  if (!existsSync(p)) return {}
  try {
    const pkg = JSON.parse(readFileSync(p, 'utf8'))
    return { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    return {}
  }
}
function detectRouter(cwd) {
  const deps = projectDeps(cwd)
  for (const [variant, pkgs] of ROUTER_PACKAGES) if (pkgs.some((n) => n in deps)) return variant
  return 'generic'
}
/**
 * Select item contents and dependencies by variantBy: router uses package.json or --router; locale uses --locale or comwit.json, defaulting to en for ui-text.
 */
function applyVariant(item, cwd, flags, cfg) {
  if (!item.variants) return { item, variant: null, detected: false }
  const names = Object.keys(item.variants)
  const byLocale = item.variantBy === 'locale'
  const chosen = byLocale ? (flags.locale ?? cfg.locale) : flags.router
  const variant = chosen ?? (byLocale ? 'en' : detectRouter(cwd))
  if (!names.includes(variant))
    die(`'${item.name}' has no '${variant}' variant. Available: ${names.join(' · ')}`)
  const v = item.variants[variant]
  let content = v.content
  // React Router 6 may provide only react-router-dom; import from that package.
  if (variant === 'react-router') {
    const deps = projectDeps(cwd)
    if ('react-router-dom' in deps && !('react-router' in deps))
      content = content.replace(/from (['"])react-router\1/g, 'from $1react-router-dom$1')
  }
  return {
    variant,
    detected: !byLocale && !chosen,
    item: {
      ...item,
      dependencies: v.dependencies,
      registryDependencies: v.registryDependencies,
      files: item.files.map((f, i) => (i === 0 ? { ...f, content } : f)),
    },
  }
}

// ── package manager ────────────────────────────────────────────────────
function detectPM(cwd) {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun'
  return 'npm'
}
// Do not re-add dependencies already declared in package.json, which would replace consumer version pins with newer ranges.
function installDeps(wanted, cwd, { dry }) {
  const declared = projectDeps(cwd)
  const deps = wanted.filter((name) => !(name in declared))
  if (!deps.length) return
  const pm = detectPM(cwd)
  const cmd = pm === 'npm' ? `npm install ${deps.join(' ')}` : `${pm} add ${deps.join(' ')}`
  log(c.dim(`  $ ${cmd}`))
  if (dry) return
  try {
    execSync(cmd, { cwd, stdio: 'inherit' })
  } catch {
    // pnpm can exit with code 1 after a successful install when build scripts such as sharp await approval.
    // Files have already been written; warn instead of aborting so users can rerun the command if needed.
    log(
      c.yellow(
        '  ⚠ Dependency installation exited with a nonzero code (for example, pnpm build scripts may need approval).'
      )
    )
    log(c.dim(`    If installation did not complete, run manually: ${cmd}`))
  }
}

// ── commands ────────────────────────────────────────────────────────────
function cmdList() {
  const idx = loadIndex()
  const byType = {}
  for (const it of idx.items) (byType[it.type] ??= []).push(it.name)
  log(c.bold(`comwit registry — ${idx.items.length} items`))
  for (const t of ['ui', 'lib', 'hook', 'theme']) {
    if (byType[t]) log(`  ${c.cyan(t.padEnd(5))} ${byType[t].sort().join(' ')}`)
  }
  for (const it of idx.items)
    if (it.variants)
      log(
        c.dim(
          it.variantBy === 'locale'
            ? `  ${it.name}: Text locales ${it.variants.join(' · ')} (--locale or comwit.json locale; default en)`
            : `  ${it.name}: Router variants ${it.variants.join(' · ')} (choose with --router)`
        )
      )
}

function cmdInit(flags) {
  const cwd = resolve(flags.cwd || process.cwd())
  const dry = !!flags.dry
  const p = configPath(cwd)
  if (existsSync(p) && !flags.overwrite) {
    if (flags.locale) {
      // Preserve configuration and change only the copy locale. Replace installed ui-text with add ui-text --overwrite.
      const current = JSON.parse(readFileSync(p, 'utf8'))
      if (!dry)
        writeFileSync(p, JSON.stringify({ ...current, locale: flags.locale }, null, 2) + '\n')
      log(c.green('✔ ') + `comwit.json locale: ${flags.locale}`)
    } else
      log(c.yellow('• ') + 'comwit.json already exists (skipped). Use --overwrite to replace it.')
  } else {
    const cfg = { ...DEFAULT_CONFIG, srcDir: detectSrcDir(cwd, DEFAULT_CONFIG.importAlias) }
    if (flags.css) cfg.css = flags.css
    if (flags.locale) cfg.locale = flags.locale
    // Detect the CSS location or use the default.
    if (!flags.css) {
      for (const guess of [
        'app/globals.css',
        'src/app/globals.css',
        'src/index.css',
        'styles/globals.css',
      ]) {
        if (existsSync(join(cwd, guess))) {
          cfg.css = guess
          break
        }
      }
    }
    if (!dry) writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n')
    log(
      c.green('✔ ') +
        `Created comwit.json (css: ${cfg.css}${cfg.srcDir ? ` · source: ${cfg.srcDir}/` : ''})`
    )
  }

  // Write comwit-tokens.css and import it to connect the token contract.
  const cfg = existsSync(p) ? readConfig(cwd) : { ...DEFAULT_CONFIG }
  const theme = loadItem('theme')
  const tokensRel = targetPath(theme.files[0].path, cfg) // <css dir>/comwit-tokens.css
  const tokensAbs = join(cwd, tokensRel)
  const r = writeFileSafe(tokensAbs, theme.files[0].content, { overwrite: !!flags.overwrite, dry })
  log(
    (r === 'skip' ? c.yellow('• ') : c.green('✔ ')) +
      `Tokens: ${tokensRel} ${r === 'skip' ? '(exists, skipped)' : ''}`
  )

  const cssAbs = join(cwd, cfg.css)
  const importLine = `@import "./comwit-tokens.css";`
  if (existsSync(cssAbs)) {
    const css = readFileSync(cssAbs, 'utf8')
    if (!css.includes('comwit-tokens.css')) {
      // Insert after the leading @import block because :root and @theme rules must follow imports.
      // Inserting rules first invalidates a later Tailwind import because imports must precede rules.
      const lines = css.split('\n')
      let at = 0
      for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim()
        if (t.startsWith('@import')) at = i + 1
        else if (t === '') continue
        else break
      }
      lines.splice(at, 0, importLine)
      if (!dry) writeFileSync(cssAbs, lines.join('\n'))
      log(c.green('✔ ') + `${cfg.css}: added token @import after the Tailwind import`)
    } else log(c.dim(`  ${cfg.css}: already imports tokens`))
  } else {
    log(
      c.yellow('• ') +
        `${cfg.css} is missing — add the following to your global CSS:\n    @import "tailwindcss";\n    @import "tw-animate-css";\n    ${importLine}`
    )
  }

  const baseDeps = [
    '@comwit/ui',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'tw-animate-css',
  ]
  if (!flags['no-install']) installDeps(baseDeps, cwd, { dry })
  else log(c.dim(`  npm dependencies (not installed): ${baseDeps.join(' ')}`))
  log(
    c.green('\nDone.') +
      ' Now run ' +
      c.cyan('comwit-ui add <component>') +
      ' to add components. Example: comwit-ui add button'
  )
}

function cmdAdd(names, flags) {
  if (!names.length) die('Specify components to add. Example: comwit-ui add button dialog')
  const cwd = resolve(flags.cwd || process.cwd())
  const dry = !!flags.dry
  const overwrite = !!flags.overwrite
  const cfg = readConfig(cwd)

  const items = resolveItems(names)
  const deps = new Set()
  log(c.bold(`add: ${names.join(', ')}`) + c.dim(`  (${items.length} resolved items)`))
  for (const raw of items) {
    const { item, variant, detected } = applyVariant(raw, cwd, flags, cfg)
    for (const d of item.dependencies || []) deps.add(d)
    for (const f of item.files) {
      const rel = targetPath(f.path, cfg)
      const abs = join(cwd, rel)
      const content = f.path.endsWith('.css') ? f.content : rewriteImports(f.content, cfg, f.path)
      const r = writeFileSafe(abs, content, { overwrite, dry })
      const mark = r === 'skip' ? c.yellow('•') : c.green('✔')
      const tag = variant ? c.cyan(` (${variant}${detected ? ' detected' : ''})`) : ''
      log(
        `  ${mark} ${rel}${tag}${r === 'skip' ? c.dim(' (exists, skipped — --overwrite)') : r === 'overwrite' ? c.dim(' (overwritten)') : ''}`
      )
    }
  }
  if (!flags['no-install']) installDeps([...deps].sort(), cwd, { dry })
  else if (deps.size)
    log(c.dim(`  npm dependencies (not installed): ${[...deps].sort().join(' ')}`))
  log(c.green('\nDone.'))
}

// ── main ────────────────────────────────────────────────────────────────
const { positional, flags } = parseArgs(process.argv.slice(2))
const cmd = positional[0]
switch (cmd) {
  case 'list':
  case 'ls':
    cmdList()
    break
  case 'init':
    cmdInit(flags)
    break
  case 'add':
    cmdAdd(positional.slice(1), flags)
    break
  case undefined:
  case 'help':
  case '--help':
  case '-h':
    log(`${c.bold('comwit-ui')} — Comwit UI component installer

  ${c.cyan('comwit-ui init')}            Set up the project (comwit.json + token contract)
  ${c.cyan('comwit-ui add <name...>')}   Install components and dependencies
  ${c.cyan('comwit-ui list')}            List available components

  Flags: --cwd <dir>  --overwrite  --dry  --no-install  --css <path>
          --router <nextjs|react-router|tanstack-router|generic>  (app-shell · tab-bar · route-boundary variants; detected from package.json by default)
          --locale <en|ko>  (default component text in lib/ui-text; init records it in comwit.json; default en)`)
    break
  default:
    die(`Unknown command: ${cmd}. See \`comwit-ui help\`.`)
}
