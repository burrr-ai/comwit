#!/usr/bin/env node
// Cross-platform mechanical setup. Product routes/data remain the AI's job.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { planPwa } from './pwa.mjs'

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = process.cwd()
const usage = 'node <skill>/scripts/setup.mjs --tabs <tabs.json> [--pwa <pwa.json>] [--dry-run] (from project root)'
// Installed with the project's comwit-ui CLI for the detected router. app-shell brings the whole
// mobile shell (tab-bar, route-boundary, page-transition, pull-to-refresh, bottom-nav, glass);
// app-screen brings the app bar. The skill's own assets only place these and list the tabs.
const UI_COMPONENTS = ['app-shell', 'app-screen', 'bottom-sheet', 'button']
// Registry items above exist from these versions on. The CLI is bin-only, so it resolves by its entry file.
const MIN_VERSIONS = {
  '@comwit/ui': { min: [0, 4], entry: '@comwit/ui' },
  'comwit-ui': { min: [0, 6], entry: 'comwit-ui/src/index.js' },
}

/** Package "exports" may hide package.json, so walk up from the resolved entry to the package root. */
function installedVersion(requireFromProject, name, entry) {
  let dir = path.dirname(requireFromProject.resolve(entry))
  for (;;) {
    const manifest = path.join(dir, 'package.json')
    if (fs.existsSync(manifest)) {
      const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'))
      if (pkg.name === name) return pkg.version
    }
    const parent = path.dirname(dir)
    if (parent === dir) throw new Error(`Cannot find the installed version of ${name}`)
    dir = parent
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    console.log(usage)
    return
  }
  let tabsPath
  let pwaPath
  let dryRun = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true
    else if (args[i] === '--tabs' && args[i + 1] && !tabsPath) tabsPath = args[++i]
    else if (args[i] === '--pwa' && args[i + 1] && !pwaPath) pwaPath = args[++i]
    else throw new Error(usage)
  }
  if (!tabsPath) throw new Error(usage)

  const pkgPath = path.join(projectRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const declared = { ...pkg.dependencies, ...pkg.devDependencies }
  const requireFromProject = createRequire(pkgPath)
  for (const name of ['@comwit/ui', '@ssgoi/react', 'lucide-react', 'comwit-ui']) {
    if (!declared[name]) throw new Error(`Required package is not declared: ${name}`)
  }
  for (const name of ['@comwit/ui', '@ssgoi/react', 'lucide-react']) requireFromProject.resolve(name)
  for (const [name, { min: [major, minor], entry }] of Object.entries(MIN_VERSIONS)) {
    const version = installedVersion(requireFromProject, name, entry)
    const [a, b] = version.split('.').map(Number)
    if (a < major || (a === major && b < minor)) {
      throw new Error(`${name}@${version} is too old; app-setup needs ${name}@${major}.${minor}.0 or newer`)
    }
  }
  if (!fs.existsSync(path.join(projectRoot, 'comwit.json'))) {
    throw new Error('comwit.json is missing. Run pnpm exec comwit-ui init first.')
  }
  const icons = requireFromProject('lucide-react')
  const tabs = JSON.parse(fs.readFileSync(path.resolve(projectRoot, tabsPath), 'utf8'))
  if (!Array.isArray(tabs) || tabs.length < 2 || tabs.length > 5) {
    throw new Error('tabs.json must contain 2–5 tabs with href, label, icon')
  }
  const hrefs = new Set()
  for (const tab of tabs) {
    if (!tab || typeof tab.href !== 'string' ||
        !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(tab.href) || hrefs.has(tab.href)) {
      throw new Error('Tab hrefs must be unique static paths, e.g. / or /search')
    }
    if (typeof tab.label !== 'string' || !tab.label.trim() ||
        typeof tab.icon !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(tab.icon) ||
        !Object.hasOwn(icons, tab.icon) || !icons[tab.icon]?.render) {
      throw new Error('Each tab needs a nonempty label and an exported Lucide icon name')
    }
    hrefs.add(tab.href)
  }

  // Plan everything before writing: missing guides or a home collision cannot
  // leave a half-installed shell. Existing custom assets are never overwritten.
  const writes = []
  const moves = []
  const review = []
  // Shell UI comes from the comwit-ui registry, never from this skill. The CLI skips files that
  // already exist, so local edits survive; --no-install keeps the project's dependency pins.
  const cliEntry = requireFromProject.resolve('comwit-ui/src/index.js')
  const components = execFileSync(process.execPath, [
    cliEntry, 'add', ...UI_COMPONENTS, '--no-install', ...(dryRun ? ['--dry'] : []),
  ], { cwd: projectRoot, encoding: 'utf8' })
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[✔•] /.test(line))
  const absolute = (relative) => path.join(projectRoot, relative)
  const read = (relative) => fs.readFileSync(absolute(relative), 'utf8')
  const write = (relative, content) => writes.push({ relative, content })
  await planPwa({
    projectRoot, skillRoot, writes, review, startUrl: tabs[0].href,
    options: pwaPath ? JSON.parse(fs.readFileSync(path.resolve(projectRoot, pwaPath), 'utf8')) : undefined,
  })
  const assetRoot = path.join(skillRoot, 'assets', 'src')
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : [full]
    })
  }
  for (const source of walk(assetRoot)) {
    const relative = path.join('src', path.relative(assetRoot, source))
    let content = fs.readFileSync(source, 'utf8')
    if (path.basename(source) === 'app-tabs.ts') {
      const imports = [...new Set(tabs.map((tab) => tab.icon))].join(', ')
      content = content.replace("import { Home } from 'lucide-react'", `import { ${imports} } from 'lucide-react'`)
      content = content.replace(
        "  { href: '/', label: '홈', icon: Home },",
        tabs.map((tab) => `  { href: ${JSON.stringify(tab.href)}, label: ${JSON.stringify(tab.label)}, icon: ${tab.icon} },`).join('\n'),
      )
    }
    if (!fs.existsSync(absolute(relative))) write(relative, content)
    else if (read(relative) !== content) review.push(`Reconcile existing file: ${relative}`)
  }

  for (const [insertName, relative] of [
    ['page.ai.md', 'src/services/page.ai.md'],
    ['state.ai.md', 'src/services/state.ai.md'],
    ['app.ai.md', 'src/app/.ai.md'],
  ]) {
    const guidePath = relative
    const current = read(guidePath)
    const insert = fs.readFileSync(path.join(skillRoot, 'assets', 'inserts', insertName), 'utf8').trimStart()
    const marker = insert.split('\n')[0]
    if (!current.includes(marker)) write(guidePath, current.trimEnd() + '\n\n' + insert)
    else if (!current.includes(insert.trimEnd())) review.push(`Reconcile existing guide block: ${relative}`)
  }

  // The installed AppShell (scroller, refresh, scroll chrome, transitions, back depth) wraps the routed UI once.
  const client = 'src/services/app/page/layout/client.tsx'
  const currentClient = read(client)
  const templateReturn = 'return <>{children}</>'
  const shellReturn = 'return <AppShell tabs={APP_TABS} top={<PwaInstallBanner />}>{children}</AppShell>'
  const shellImports = [
    "import { AppShell } from '@/lib/components/ui/app-shell'",
    "import { APP_TABS } from './app-tabs'",
    "import { PwaInstallBanner } from './pwa-install-banner'",
  ].join('\n')
  if (!currentClient.includes('<AppShell')) {
    if (currentClient.split(templateReturn).length === 2 &&
        /^(['"])use client\1\r?\n/.test(currentClient)) {
      write(client, currentClient
        .replace(/^(['"])use client\1\r?\n/, `$&\n${shellImports}\n`)
        .replace(templateReturn, shellReturn))
    } else review.push(`Wrap routed UI with <AppShell tabs={APP_TABS} top={<PwaInstallBanner />}>, preserving user hydration: ${client}`)
  } else if (!currentClient.includes('<AppShell tabs={APP_TABS}')) {
    review.push(`Verify the existing AppShell receives tabs={APP_TABS} and preserves user hydration: ${client}`)
  }

  const home = 'src/app/(app)/page.tsx'
  if (fs.existsSync(absolute(home))) {
    if (hrefs.has('/')) {
      const target = 'src/app/(app)/(top-level)/page.tsx'
      if (fs.existsSync(absolute(target))) throw new Error(`Home route collision: ${home} and ${target}`)
      moves.push({ from: home, to: target })
      // Route-local companions and relative imports may depend on the old level.
      review.push('Check moved home relative imports and route-local layout/loading/error/metadata dependencies')
    } else review.push('Move the existing home into the appropriate group or replace it with a redirect inside a group')
  }
  for (const tab of tabs) {
    const relative = `src/app/(app)/(top-level)${tab.href === '/' ? '' : tab.href}/page.tsx`
    if (!fs.existsSync(absolute(relative)) && !moves.some((move) => move.to === relative)) {
      review.push(`Build or relocate tab page: ${relative}`)
    }
  }

  if (!dryRun) {
    for (const { relative, content } of writes) {
      fs.mkdirSync(path.dirname(absolute(relative)), { recursive: true })
      fs.writeFileSync(absolute(relative), content)
    }
    for (const { from, to } of moves) {
      fs.mkdirSync(path.dirname(absolute(to)), { recursive: true })
      fs.renameSync(absolute(from), absolute(to))
    }
  }
  console.log(JSON.stringify({
    dryRun, components, writes: writes.map((entry) => entry.relative), moves, review,
    next: dryRun
      ? 'Review the plan, then rerun without --dry-run. No files have been changed.'
      : 'Shell installed; product work remains. Resolve review items, connect requested routes, list seeds, detail queries and shared UI using the three installed guides, then validate and clean up (see SKILL.md).',
  }, null, 2))
}

try {
  await main()
} catch (error) {
  console.error(`app-setup: ${error.message}`)
  process.exitCode = 1
}
