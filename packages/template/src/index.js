#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// create-comwit scaffolds a Next.js project from the Comwit template.
//   npm create comwit@latest my-app
//   npx create-comwit@latest my-app [--opennext] [--pm pnpm|npm|yarn|bun] [--no-install] [--no-git] [--cwd <dir>]
//
// The complete template is bundled in template/. Uses only Node built-ins.
// Substitute the project name in package.json and README; copy other files unchanged.
// ─────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const TEMPLATE = join(HERE, '..', 'template')
const VARIANTS = join(HERE, '..', 'variants')
const DOCS = 'https://library.comwit.io/template'

// ── tiny ansi ─────────────────────────────────────────────────────────────
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
}
const log = (...a) => console.log(...a)
const die = (msg) => {
  console.error(c.red('✖ ') + msg)
  process.exit(1)
}

// ── args ────────────────────────────────────────────────────────────────
const VALUE_FLAGS = new Set(['cwd', 'pm', 'name'])
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
      } else if (key.startsWith('no-')) flags[key.slice(3)] = false
      else flags[key] = true
    } else positional.push(a)
  }
  return { positional, flags }
}

function usage() {
  log(`${c.bold('create-comwit')} — Next.js project from the Comwit template

  ${c.cyan('npm create comwit@latest <dir>')}
  ${c.cyan('npx create-comwit@latest <dir>')} [options]

Options
  --opennext        deploy target Cloudflare Workers via OpenNext (adds wrangler.jsonc, open-next.config.ts, scripts)
  --name <name>     package name (default: the directory name)
  --pm <manager>    pnpm · npm · yarn · bun (default: pnpm when installed, else the invoking manager)
  --no-install      skip dependency installation
  --no-git          skip git init and the initial commit
  --cwd <dir>       create the project relative to this directory
  --dry             print what would be written and stop

Docs: ${DOCS}`)
}

// ── helpers ───────────────────────────────────────────────────────────────
function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) walk(abs, base, out)
    else out.push(relative(base, abs))
  }
  return out
}
function has(cmd) {
  const r = spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' })
  return r.status === 0
}
// npm create comwit exposes the invoking package manager through npm_config_user_agent.
function invokingManager() {
  const agent = process.env.npm_config_user_agent ?? ''
  const name = agent.split(' ')[0]?.split('/')[0]
  return ['pnpm', 'npm', 'yarn', 'bun'].includes(name) ? name : null
}
function chooseManager(flag) {
  if (flag) {
    if (!['pnpm', 'npm', 'yarn', 'bun'].includes(flag)) die(`unknown package manager: ${flag}`)
    return flag
  }
  // The template assumes pnpm in AGENTS.md. Prefer pnpm when available, otherwise use the invoking manager.
  if (has('pnpm')) return 'pnpm'
  return invokingManager() ?? 'npm'
}
const NAME_RE = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

// ── main ────────────────────────────────────────────────────────────────
const { positional, flags } = parseArgs(process.argv.slice(2))
if (flags.help || flags.h) {
  usage()
  process.exit(0)
}
if (flags.version || flags.v) {
  log(JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8')).version)
  process.exit(0)
}
const dir = positional[0]
if (!dir) {
  usage()
  die('tell me where to create the project: create-comwit <dir>')
}
if (!existsSync(join(TEMPLATE, 'package.json')))
  die('the bundled template is missing — reinstall create-comwit')

const cwd = resolve(flags.cwd ?? process.cwd())
const target = resolve(cwd, dir)
const name = flags.name ?? basename(target)
if (!NAME_RE.test(name)) die(`"${name}" is not a valid package name (use --name to set one)`)
if (
  existsSync(target) &&
  readdirSync(target).some((entry) => entry !== '.git' && entry !== '.DS_Store')
)
  die(`${target} already exists and is not empty`)

const files = walk(TEMPLATE)
const variantFiles = flags.opennext ? walk(join(VARIANTS, 'opennext', 'files')) : []
log(
  `${c.bold('create-comwit')} → ${c.cyan(relative(process.cwd(), target) || '.')} ${c.dim(`(${files.length + variantFiles.length} files${flags.opennext ? ', opennext' : ''})`)}`
)

if (flags.dry) {
  log(files.map((f) => `  ${f}`).join('\n'))
  if (flags.opennext) log(variantFiles.map((f) => `  ${f} (opennext)`).join('\n'))
  process.exit(0)
}

// Ship _gitignore because npm omits .gitignore, then restore its filename during scaffolding.
const RENAME = { _gitignore: '.gitignore' }
for (const rel of files) {
  const out = join(target, RENAME[rel] ?? rel)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, readFileSync(join(TEMPLATE, rel)))
}

// Substitute the project's name only.
const pkgPath = join(target, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.name = name
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
const readmePath = join(target, 'README.md')
writeFileSync(readmePath, readFileSync(readmePath, 'utf8').replaceAll('{{name}}', name))
if (flags.opennext) applyOpenNext(target, name, variantFiles)
log(c.green('✔ ') + 'files written')

// ── --opennext: Cloudflare Workers overlay ──────────────────────────────
// The handwritten variants/opennext overlay adds files, merges package.json,
// initializes development in next.config.ts, replaces AGENTS.md deployment guidance, and extends README/.gitignore.
function applyOpenNext(target, name, variantFiles) {
  const dir = join(VARIANTS, 'opennext')
  const read = (rel) => readFileSync(join(target, rel), 'utf8')
  const write = (rel, text) => writeFileSync(join(target, rel), text)
  // Worker names allow only lowercase letters, digits, and hyphens.
  const worker = name
    .replace(/^@/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  for (const rel of variantFiles) {
    const out = join(target, rel)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(
      out,
      readFileSync(join(dir, 'files', rel), 'utf8').replaceAll('{{worker}}', worker)
    )
  }
  const patch = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const pkg = JSON.parse(read('package.json'))
  for (const key of ['scripts', 'dependencies', 'devDependencies'])
    pkg[key] = { ...pkg[key], ...patch[key] }
  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

  // workerd installs the platform binary used by Cloudflare development and previews.
  // Keep both pnpm 10 and pnpm 11 build allowlists in the generated project.
  const workspace = read('pnpm-workspace.yaml')
  if (!workspace.includes('onlyBuiltDependencies:\n') || !workspace.includes('allowBuilds:\n'))
    die('pnpm-workspace.yaml changed shape; the opennext overlay needs updating')
  write(
    'pnpm-workspace.yaml',
    workspace
      .replace('onlyBuiltDependencies:\n', 'onlyBuiltDependencies:\n  - workerd\n')
      .replace('allowBuilds:\n', 'allowBuilds:\n  workerd: true\n')
  )

  const nextConfig = read('next.config.ts')
  const exportLine = 'export default withServerFn(nextConfig);'
  if (!nextConfig.includes(exportLine))
    die('next.config.ts changed shape; the opennext overlay needs updating')
  write(
    'next.config.ts',
    nextConfig
      .replace(
        'import type { NextConfig } from "next";',
        'import type { NextConfig } from "next";\nimport { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";'
      )
      .replace(
        exportLine,
        '// Enable Cloudflare bindings (getCloudflareContext) during `next dev` too.\ninitOpenNextCloudflareForDev();\n\n' +
          exportLine
      )
  )

  // Replace an existing Deploy section in AGENTS.md or append one to the default template.
  const agents = read('AGENTS.md')
  const deployAt = agents.lastIndexOf('## Deploy')
  const before = deployAt < 0 ? agents.trimEnd() + '\n\n---\n\n' : agents.slice(0, deployAt)
  write('AGENTS.md', before + readFileSync(join(dir, 'agents-deploy.md'), 'utf8'))
  // Join fragments with one blank line instead of relying on whitespace that formatters may remove.
  const fragment = (file) => readFileSync(join(dir, file), 'utf8').trim() + '\n'
  write('README.md', read('README.md').trimEnd() + '\n\n' + fragment('readme.md'))
  write('.gitignore', read('.gitignore').trimEnd() + '\n\n' + fragment('gitignore'))
}

// ── install ─────────────────────────────────────────────────────────────
const pm = chooseManager(flags.pm)
if (flags.install !== false) {
  log(c.dim(`$ ${pm} install`))
  const r = spawnSync(pm, ['install'], {
    cwd: target,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (r.status !== 0) log(c.red('✖ ') + `${pm} install failed — run it yourself inside ${dir}`)
  else log(c.green('✔ ') + 'dependencies installed')
} else log(c.dim('• install skipped'))

// ── git ─────────────────────────────────────────────────────────────────
if (flags.git !== false && has('git')) {
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: target,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    })
  let inside = false
  try {
    inside = git('rev-parse', '--is-inside-work-tree').trim() === 'true'
  } catch {
    inside = false
  }
  if (inside) log(c.dim('• already inside a git repository, skipping git init'))
  else {
    try {
      git('init', '-q')
      git('add', '-A')
      git(
        '-c',
        'user.name=create-comwit',
        '-c',
        'user.email=noreply@comwit.io',
        'commit',
        '-q',
        '-m',
        'Initial commit from create-comwit'
      )
      log(c.green('✔ ') + 'git repository initialized')
    } catch {
      log(c.dim('• git init skipped (could not create the initial commit)'))
    }
  }
}

// ── next steps ──────────────────────────────────────────────────────────
const run = pm === 'npm' ? 'npm run' : pm
log(`
${c.bold('Next steps')}
  cd ${relative(process.cwd(), target) || '.'}${flags.install === false ? `\n  ${pm} install` : ''}
  ${run} dev            ${c.dim('http://localhost:3000')}
  ${run} validate       ${c.dim('typecheck + lint, after every change')}${flags.opennext ? `\n  ${run} preview        ${c.dim('Cloudflare Worker locally (OpenNext)')}\n  ${run} deploy         ${c.dim('wrangler login once, then deploy')}` : ''}

Read ${c.cyan('AGENTS.md')} and the ${c.cyan('.ai.md')} next to each layer before writing code.
Architecture: ${c.cyan(DOCS)}
`)
