#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// comwit-ui — comwit UI 컴포넌트를 내 프로젝트로 설치하는 CLI. (설치되는 엔진은 @comwit/ui)
//   comwit-ui init              프로젝트 세팅(comwit.json + 토큰 계약 배선)
//   comwit-ui add <name...>     컴포넌트 + registryDependencies + npm deps 설치
//   comwit-ui list              설치 가능한 컴포넌트 목록
//
// shadcn 툴 비의존 — comwit 자체 레지스트리(번들된 registry/*.json)를 읽는다. zero-dep(Node 내장만).
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
// 값을 받는 플래그만 다음 인자를 먹는다 — `--overwrite add button` 에서 add 가 플래그 값이 되지 않게.
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
// 옛 이름 → 지금 이름. 템플릿 이름은 중성적으로 간다(엔진 브랜드가 아니라 역할).
const ALIASES = { sonner: 'toast' }
// 동작 훅은 이제 엔진(@comwit/ui)이 내보낸다 — 복사할 소스가 없다.
const MOVED_TO_ENGINE = {
  'use-mobile': 'useMobile · useMobileDevice',
  'use-scroll-chrome': 'ScrollChromeProvider · useScrollChrome',
}
function canonical(name) {
  const to = ALIASES[name]
  if (to) log(c.dim(`  '${name}' 은(는) 이제 '${to}' 입니다.`))
  return to ?? name
}
function loadItem(name) {
  const p = join(REGISTRY_DIR, `${name}.json`)
  if (!existsSync(p)) {
    if (MOVED_TO_ENGINE[name])
      die(
        `'${name}' 은(는) 이제 @comwit/ui 가 내보냅니다 — import { ${MOVED_TO_ENGINE[name].replace(/ · /g, ', ')} } from '@comwit/ui'. 복사할 파일이 없습니다.`
      )
    die(`레지스트리에 '${name}' 이(가) 없습니다. \`comwit list\` 로 확인하세요.`)
  }
  return JSON.parse(readFileSync(p, 'utf8'))
}
/** name 목록을 registryDependencies 까지 재귀 해석해 위상정렬(의존 먼저) + 중복 제거. */
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
// aliases 는 importAlias 뒤에 붙는 경로다(`@/` + `components/ui`). 파일은 importAlias 가 가리키는
// 폴더(srcDir) 아래에 놓인다 — `@/*` → `./src/*` 인 프로젝트는 srcDir 이 `src` 다.
// aliases.utils 는 cn() 파일 위치(확장자 없이). 없으면 `<lib>/utils`.
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
  if (!existsSync(p)) die('comwit.json 이 없습니다. 먼저 `comwit init` 을 실행하세요.')
  const raw = JSON.parse(readFileSync(p, 'utf8'))
  const cfg = { ...DEFAULT_CONFIG, ...raw, aliases: { ...DEFAULT_CONFIG.aliases, ...raw.aliases } }
  cfg.srcDir ??= detectSrcDir(cwd, cfg.importAlias)
  return cfg
}
function utilsAlias(cfg) {
  return cfg.aliases.utils ?? `${cfg.aliases.lib}/utils`
}

// tsconfig/jsconfig 의 paths 에서 importAlias 가 가리키는 폴더를 읽는다("@/*": ["./src/*"] → "src").
// 못 읽으면 프로젝트 루트("")다 — comwit.json 의 srcDir 로 직접 지정할 수 있다.
function detectSrcDir(cwd, importAlias) {
  for (const file of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(cwd, file)
    if (!existsSync(p)) continue
    let json
    try {
      // tsconfig 는 주석·끝 쉼표를 허용한다. 문자열 안의 `/*`(예: "@/*")를 건드리지 않도록 문자열은 건너뛴다.
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

// ── import 경로 재작성 ───────────────────────────────────────────────────
// 템플릿 소스의 상대 import 를 소비 프로젝트의 alias 로 바꾼다. filePath(레지스트리 경로)로 그 파일이
// 어느 폴더에 있었는지 알아야 `./X` 를 형제 ui 로 볼지 형제 lib 로 볼지 정할 수 있다.
//   ../../lib/X → @/lib/X (utils 는 aliases.utils) · ../../hooks/X → @/hooks/X (bare ../../hooks → use-mobile)
//   components/ui 의 ./X → @/components/ui/X · lib 의 ./X → @/lib/X
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
    // 라우터 변형끼리는 `./tab-bar.nextjs` 처럼 서로를 가리킨다 — 설치되면 접미사 없는 하나의 파일이다.
    else if (spec.startsWith('./')) mapped = sibling(spec.slice(2).replace(VARIANT_SUFFIX, ''))
    if (!mapped) return m // @comwit/ui, npm, react 등은 그대로
    return `${kw}${q}${A}${mapped}${q}`
  })
}

// ── 파일 배치 경로 (레지스트리 path → 프로젝트 상대 경로) ──────────────────
// 소스 파일은 srcDir 아래(importAlias 가 가리키는 곳), 토큰 css 는 cfg.css 옆에 놓인다.
function targetPath(filePath, cfg) {
  const src = (rel) => join(cfg.srcDir ?? '', rel)
  if (filePath.startsWith('components/ui/'))
    return src(join(cfg.aliases.ui, filePath.slice('components/ui/'.length)))
  if (filePath === 'lib/utils.ts') return src(`${utilsAlias(cfg)}.ts`)
  if (filePath.startsWith('lib/')) return src(join(cfg.aliases.lib, filePath.slice('lib/'.length)))
  if (filePath.startsWith('hooks/'))
    return src(join(cfg.aliases.hooks, filePath.slice('hooks/'.length)))
  if (filePath.endsWith('.css')) return join(dirname(cfg.css), filePath) // 토큰 css 는 globals.css 옆
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

// ── 라우터 감지 (route-boundary 변형 선택) ───────────────────────────────
// 변형 이름은 registry 의 variants 키와 같다: nextjs · react-router · tanstack-router · generic.
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
 * variants 가 있는 아이템의 content/deps 를 고른 변형으로 바꾼다.
 *   variantBy 'router' — package.json 에서 감지(또는 --router)
 *   variantBy 'locale' — --locale 또는 comwit.json 의 locale(기본 en). ui-text 의 문구 언어다.
 */
function applyVariant(item, cwd, flags, cfg) {
  if (!item.variants) return { item, variant: null, detected: false }
  const names = Object.keys(item.variants)
  const byLocale = item.variantBy === 'locale'
  const chosen = byLocale ? (flags.locale ?? cfg.locale) : flags.router
  const variant = chosen ?? (byLocale ? 'en' : detectRouter(cwd))
  if (!names.includes(variant))
    die(`'${item.name}' 에 '${variant}' 변형이 없습니다. 가능: ${names.join(' · ')}`)
  const v = item.variants[variant]
  let content = v.content
  // React Router 6 는 react-router-dom 만 설치돼 있을 수 있다 — 그쪽에서 import 한다.
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
// 이미 package.json 에 있는 패키지는 다시 add 하지 않는다 — 재설치는 프로젝트가 고정한 버전(7.2.0 → ^최신)을 바꾼다.
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
    // pnpm 은 승인 대기 빌드 스크립트(sharp 등)가 있으면 설치가 성공해도 exit 1 을 낸다.
    // 파일은 이미 다 썼으니 여기서 죽이지 말고 경고만 — 필요 시 사용자가 위 명령을 재실행.
    log(
      c.yellow(
        '  ⚠ 의존성 설치가 0이 아닌 코드로 끝났습니다 (pnpm 빌드스크립트 승인 대기 등일 수 있음).'
      )
    )
    log(c.dim(`    설치가 안 됐다면 수동 실행: ${cmd}`))
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
            ? `  ${it.name}: 문구 로케일 ${it.variants.join(' · ')} (--locale 또는 comwit.json locale, 기본 en)`
            : `  ${it.name}: 라우터 감지 변형 ${it.variants.join(' · ')} (--router 로 지정)`
        )
      )
}

function cmdInit(flags) {
  const cwd = resolve(flags.cwd || process.cwd())
  const dry = !!flags.dry
  const p = configPath(cwd)
  if (existsSync(p) && !flags.overwrite) {
    if (flags.locale) {
      // 설정은 그대로 두고 문구 로케일만 바꾼다. 이미 설치된 ui-text 는 `add ui-text --overwrite` 로 교체한다.
      const current = JSON.parse(readFileSync(p, 'utf8'))
      if (!dry)
        writeFileSync(p, JSON.stringify({ ...current, locale: flags.locale }, null, 2) + '\n')
      log(c.green('✔ ') + `comwit.json locale: ${flags.locale}`)
    } else log(c.yellow('• ') + 'comwit.json 이 이미 있습니다 (건너뜀). 덮으려면 --overwrite.')
  } else {
    const cfg = { ...DEFAULT_CONFIG, srcDir: detectSrcDir(cwd, DEFAULT_CONFIG.importAlias) }
    if (flags.css) cfg.css = flags.css
    if (flags.locale) cfg.locale = flags.locale
    // css 위치 자동 감지 (없으면 기본)
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
        `comwit.json 생성 (css: ${cfg.css}${cfg.srcDir ? ` · 소스: ${cfg.srcDir}/` : ''})`
    )
  }

  // 토큰 계약 배선 — comwit-tokens.css 쓰고 css 에서 @import
  const cfg = existsSync(p) ? readConfig(cwd) : { ...DEFAULT_CONFIG }
  const theme = loadItem('theme')
  const tokensRel = targetPath(theme.files[0].path, cfg) // <css dir>/comwit-tokens.css
  const tokensAbs = join(cwd, tokensRel)
  const r = writeFileSafe(tokensAbs, theme.files[0].content, { overwrite: !!flags.overwrite, dry })
  log(
    (r === 'skip' ? c.yellow('• ') : c.green('✔ ')) +
      `토큰: ${tokensRel} ${r === 'skip' ? '(존재, 건너뜀)' : ''}`
  )

  const cssAbs = join(cwd, cfg.css)
  const importLine = `@import "./comwit-tokens.css";`
  if (existsSync(cssAbs)) {
    const css = readFileSync(cssAbs, 'utf8')
    if (!css.includes('comwit-tokens.css')) {
      // CSS 규칙(:root/@theme)은 @import 뒤에 와야 하므로, 선두 @import 블록 다음에 삽입한다.
      // (최상단에 넣으면 뒤따르는 @import "tailwindcss" 가 "@import must precede rules" 로 무효화됨)
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
      log(c.green('✔ ') + `${cfg.css} 에 토큰 @import 추가 (tailwind import 뒤)`)
    } else log(c.dim(`  ${cfg.css} 에 이미 토큰 import 있음`))
  } else {
    log(
      c.yellow('• ') +
        `${cfg.css} 없음 — 아래를 전역 CSS 에 추가하세요:\n    @import "tailwindcss";\n    @import "tw-animate-css";\n    ${importLine}`
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
  else log(c.dim(`  npm deps (미설치): ${baseDeps.join(' ')}`))
  log(
    c.green('\n완료.') +
      ' 이제 ' +
      c.cyan('comwit-ui add <컴포넌트>') +
      ' 로 추가하세요. 예: comwit-ui add button'
  )
}

function cmdAdd(names, flags) {
  if (!names.length) die('추가할 컴포넌트 이름이 필요합니다. 예: comwit add button dialog')
  const cwd = resolve(flags.cwd || process.cwd())
  const dry = !!flags.dry
  const overwrite = !!flags.overwrite
  const cfg = readConfig(cwd)

  const items = resolveItems(names)
  const deps = new Set()
  log(c.bold(`add: ${names.join(', ')}`) + c.dim(`  (해석된 ${items.length} 아이템)`))
  for (const raw of items) {
    const { item, variant, detected } = applyVariant(raw, cwd, flags, cfg)
    for (const d of item.dependencies || []) deps.add(d)
    for (const f of item.files) {
      const rel = targetPath(f.path, cfg)
      const abs = join(cwd, rel)
      const content = f.path.endsWith('.css') ? f.content : rewriteImports(f.content, cfg, f.path)
      const r = writeFileSafe(abs, content, { overwrite, dry })
      const mark = r === 'skip' ? c.yellow('•') : c.green('✔')
      const tag = variant ? c.cyan(` (${variant}${detected ? ' 감지' : ''})`) : ''
      log(
        `  ${mark} ${rel}${tag}${r === 'skip' ? c.dim(' (존재, 건너뜀 — --overwrite)') : r === 'overwrite' ? c.dim(' (덮어씀)') : ''}`
      )
    }
  }
  if (!flags['no-install']) installDeps([...deps].sort(), cwd, { dry })
  else if (deps.size) log(c.dim(`  npm deps (미설치): ${[...deps].sort().join(' ')}`))
  log(c.green('\n완료.'))
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
    log(`${c.bold('comwit-ui')} — comwit UI 컴포넌트 설치 CLI

  ${c.cyan('comwit-ui init')}            프로젝트 세팅 (comwit.json + 토큰 계약)
  ${c.cyan('comwit-ui add <name...>')}   컴포넌트 + 의존 설치
  ${c.cyan('comwit-ui list')}            설치 가능한 컴포넌트 목록

  플래그: --cwd <dir>  --overwrite  --dry  --no-install  --css <path>
          --router <nextjs|react-router|tanstack-router|generic>  (app-shell · tab-bar · route-boundary 변형 — 기본은 package.json 에서 감지)
          --locale <en|ko>  (컴포넌트 기본 문구 lib/ui-text — init 은 comwit.json 에 기록, 기본 en)`)
    break
  default:
    die(`알 수 없는 명령: ${cmd}. \`comwit-ui help\` 참고.`)
}
