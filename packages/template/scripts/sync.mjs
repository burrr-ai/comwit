#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// sync.mjs — comwit-template 원본 체크아웃을 읽어 `packages/template/template/` 스냅샷을 다시 만든다.
//
//   node packages/template/scripts/sync.mjs [--source <path>] [--dry]
//
// 원본은 절대 쓰지 않는다(읽기만). 결과는 create-comwit 이 번들해 배포하는 "가치 중립" 템플릿:
//   · 특정 인프라(클라우드 DB/Storage 프로비저닝, 배포 파이프라인, 호스팅 샌드박스)에 묶인 파일은 뺀다
//   · 폴더 구조·.ai.md·스킬(app-setup, auth-setup, seo-optimize, refactoring)·lint 규칙은 그대로 가져온다
//   · 남은 인프라 문구는 PATCHES 로 바꾸고, 통째로 다시 쓰는 파일은 overrides/ 에서 덮는다
//
// 원본이 바뀌어 패치 대상 문장이 사라지면 실패한다 — 조용히 낡은 문구가 남는 것보다 낫다.
// 마지막에 verify.mjs 를 돌려 금지 토큰이 남지 않았는지 확인한다.
// ─────────────────────────────────────────────────────────────────────────
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { verifyTemplate } from './verify.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(here, '..')
const OUT = join(pkgRoot, 'template')
const OVERRIDES = join(pkgRoot, 'overrides')
const STATE = join(pkgRoot, 'sync-state.json')

// ── args ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
let source = process.env.COMWIT_TEMPLATE_SOURCE ?? join(homedir(), 'work/projects/comwit-template')
let dry = false
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--source' && argv[i + 1]) source = argv[++i]
  else if (argv[i] === '--dry') dry = true
  else if (argv[i] === '--help') {
    console.log('node sync.mjs [--source <comwit-template checkout>] [--dry]')
    process.exit(0)
  } else die(`unknown argument: ${argv[i]}`)
}
source = resolve(source)

function die(message) {
  console.error(`✖ sync: ${message}`)
  process.exit(1)
}

// ── what stays out ───────────────────────────────────────────────────────
// 정확한 상대 경로, 또는 '/' 로 끝나면 그 폴더 전체.
const EXCLUDE = [
  // 생성물·의존성·잠금
  '.git/',
  '.next/',
  'node_modules/',
  'dist/',
  'pnpm-lock.yaml',
  'next-env.d.ts',
  'tsconfig.tsbuildinfo',
  'public/sw.js',
  'public/version.json',
  // create-next-app 잔재(참조 없음)
  'public/file.svg',
  'public/globe.svg',
  'public/next.svg',
  'public/vercel.svg',
  'public/window.svg',
  // 특정 클라우드 배포·계약
  '.gitea/',
  'contracts/',
  'scripts/brrrd-adapter.mjs',
  'scripts/brrrd-runtime-pages.mjs',
  'src/instrumentation.ts',
  // 호스팅 샌드박스 전용 도구·브릿지
  '.tools/',
  '.mcp.json',
  '.claude/settings.json',
  'src/lib/components/sandbox-bridge.tsx',
  'src/lib/components/react-grab-init.tsx',
  'src/lib/utils/sandbox-events.ts',
  'src/services/app/page/vibe-coding-user-guide/',
  // 클라우드 리소스 프로비저닝(DB/Storage 조각·스캐폴드·env 동기화·MCP 등록)
  '.agents/fragments/',
  // 특정 스토리지 프로비저닝에 묶인 스킬(영상 오프로드) — 범용 규칙은 AGENTS.md § Storage/Media 로 대체
  '.agents/skills/video-offload/',
  '.claude/skills/video-offload/',
  '.agents/scaffolds/',
  '.agents/state/',
  '.agents/scripts/sync-resource-env.mjs',
  '.agents/scripts/project-env.mjs',
  '.agents/scripts/verify-env-merge.mjs',
  '.agents/scripts/register-mcp.mjs',
  '.agents/tests/brrrd-runtime-pages.test.mjs',
  '.agents/tests/register-mcp.test.mjs',
  // 체크아웃 개인 설정 · overrides 가 다시 쓰는 파일
  'AGENTS.override.md',
  'CLAUDE.local.md',
  '.gitignore',
  '.env.example',
  '.records/',
]
const EXCLUDE_BASENAMES = new Set(['.DS_Store'])
const EXCLUDE_SUFFIXES = ['.log', '.tsbuildinfo']

function excluded(rel) {
  const base = rel.slice(rel.lastIndexOf('/') + 1)
  if (EXCLUDE_BASENAMES.has(base) || EXCLUDE_SUFFIXES.some((s) => base.endsWith(s))) return true
  return EXCLUDE.some((entry) => (entry.endsWith('/') ? rel.startsWith(entry) : rel === entry))
}

// ── text patches: every `from` must appear exactly once ──────────────────
const PATCHES = {
  'package.json': (text) => {
    const pkg = JSON.parse(text)
    delete pkg.id
    pkg.name = 'my-app'
    pkg.description = 'Next.js app scaffolded with create-comwit'
    pkg.scripts.dev = 'next dev'
    for (const name of ['@brrrd/adapter', '@libsql/client', '@tursodatabase/serverless']) {
      if (!(name in pkg.dependencies)) die(`package.json: expected dependency ${name} to remove`)
      delete pkg.dependencies[name]
    }
    for (const name of ['react-grab']) {
      if (!(name in pkg.devDependencies))
        die(`package.json: expected devDependency ${name} to remove`)
      delete pkg.devDependencies[name]
    }
    return `${JSON.stringify(pkg, null, 2)}\n`
  },
  '.claude/launch.json': [['"port": 4000', '"port": 3000']],
  'src/lib/utils/index.ts': [['export * from "./sandbox-events"\n', '']],
  'src/app/layout.tsx': [
    ['import { ReactGrabInit } from "@/lib/components/react-grab-init";\n', ''],
    ['import { SandboxBridge } from "@/lib/components/sandbox-bridge";\n', ''],
    ['        <ReactGrabInit />\n        <SandboxBridge />\n', ''],
  ],
  'src/app/sw.ts': [
    ['declare const __COMWIT_APP_VERSION__: string;', 'declare const __APP_VERSION__: string;'],
    ['const APP_VERSION = __COMWIT_APP_VERSION__;', 'const APP_VERSION = __APP_VERSION__;'],
    [
      'const CACHE_NAMESPACE = `comwit-${APP_VERSION}`;',
      'const CACHE_NAMESPACE = `app-${APP_VERSION}`;',
    ],
    [
      '              cacheName.startsWith("comwit-") &&',
      '              cacheName.startsWith("app-") &&',
    ],
    ['  "/mcp/",\n  "/storage/",\n', ''],
  ],
  'scripts/build-service-worker.mjs': [
    [
      '__COMWIT_APP_VERSION__: JSON.stringify(appVersion)',
      '__APP_VERSION__: JSON.stringify(appVersion)',
    ],
  ],
  'src/lib/components/app-version-guard.tsx': [
    ['process.env.NEXT_PUBLIC_COMWIT_APP_VERSION', 'process.env.NEXT_PUBLIC_APP_VERSION'],
    ['"comwit-app-version-reload:"', '"app-version-reload:"'],
  ],
  'src/lib/components/service-worker-register.tsx': [
    ['cacheName.startsWith("comwit-")', 'cacheName.startsWith("app-")'],
    ['"comwit-dev-service-worker-cleanup"', '"app-dev-service-worker-cleanup"'],
  ],
  'src/server/db/schema.ts': [
    [
      ' * TODO: 컴윗 MCP setup_database로 DB를 연결한 뒤 여기에 테이블을 정의하세요.',
      ' * TODO: 데이터베이스를 연결한 뒤(AGENTS.md § Database) 여기에 테이블을 정의하세요.',
    ],
  ],
  'src/server/repository/.ai.md': [
    [
      '(`@/lib/image` — 컴윗 MCP `setup_storage` 연결 시 설치)',
      '(`@/lib/image` — 스토리지를 연결할 때 함께 추가한다)',
    ],
  ],
  'src/services/page.ai.md': [
    [
      '(리사이즈 유틸 `resizeImage` 와 `ImageAsset` 타입은 `@/lib/image` — 컴윗 MCP `setup_storage` 연결 시 스크립트가 설치한다.)',
      '(리사이즈 유틸 `resizeImage` 와 `ImageAsset` 타입은 `@/lib/image` — 스토리지를 연결할 때 함께 추가한다.)',
    ],
    [
      '// 2) presign 발급은 state 액션 경유 (내부적으로 api → Comwit Cloud)',
      '// 2) presign 발급은 state 액션 경유 (내부적으로 api → 스토리지 presign)',
    ],
  ],
  'src/server/repository/schema.dbml': [
    [
      '// (@/lib/image · 컴윗 MCP setup_storage 연결 시 설치) 여러 장은 ImageAsset[] JSON.',
      '// (@/lib/image · 스토리지를 연결할 때 함께 추가) 여러 장은 ImageAsset[] JSON.',
    ],
  ],
  '.agents/skills/seo-optimize/assets/site-config.ts': [
    ['  name: "MVPStar Template",', '  name: "My App",'],
    ['  title: "MVPStar Template",', '  title: "My App",'],
    [
      '    "MVPStar에서 제작한 빠른 MVP 개발 템플릿입니다. Next.js 16 기반으로 구축되어 아이디어를 신속하게 실현할 수 있습니다.",',
      '    "Next.js 16 으로 만든 서비스입니다. 서비스에 맞게 이 설명을 바꾸세요.",',
    ],
  ],
  'src/lib/components/brand-mark.tsx': [
    [
      ' * 컴윗 심볼 마크 — 2인 실루엣 + 블루 그라디언트, 무배경.',
      ' * 기본 심볼 마크 — 2인 실루엣 + 블루 그라디언트, 무배경. 브랜드가 정해지면 교체한다.',
    ],
  ],
  'src/lib/components/foresight-link.tsx': [
    [
      ' * 컴윗 본가에서는 ForesightJS(마우스 궤적 예측 prefetch)로 구현하지만, base-template 에서는\n * 의존성 없이 동작하도록 평범한 next/link 로 둔다.',
      ' * ForesightJS(마우스 궤적 예측 prefetch)로 바꿔 끼울 수 있게 이름을 맞춘 자리다. 기본은\n * 의존성 없이 동작하도록 평범한 next/link 로 둔다.',
    ],
    [
      ' * 예측 prefetch 가 필요하면 `@foresightjs/react` 를 설치하고 본가 구현으로 교체하면 된다.',
      ' * 예측 prefetch 가 필요하면 `@foresightjs/react` 를 설치하고 이 파일만 교체하면 된다.',
    ],
  ],
  // auth-setup: Better Auth + Drizzle 는 그대로, "어느 DB 인가" 만 중립으로.
  '.agents/skills/auth-setup/SKILL.md': [
    [
      'description: Install Better Auth on Drizzle + Comwit Cloud libSQL for one or more services. Triggers - "인증 설정", "로그인", "회원가입", "auth 추가". Requires a connected Comwit Cloud database (Comwit MCP `setup_database`) first.',
      'description: Install Better Auth on Drizzle for one or more services. Triggers - "인증 설정", "로그인", "회원가입", "auth 추가". Requires a connected Drizzle database (AGENTS.md § Database) first.',
    ],
    [
      'Set up per-service authentication using Better Auth with Drizzle ORM on Comwit\nCloud libSQL.',
      'Set up per-service authentication using Better Auth with Drizzle ORM on the\nproject database.',
    ],
    [
      '- A Comwit Cloud database is connected through the Comwit MCP `setup_database`\n  tool and its `nextSteps` command. Verify\n  `src/server/db/index.ts` and `drizzle.config.ts` exist and `.env` contains non-empty\n  `COMWIT_DATABASE_ID`, `DATABASE_URL`, and `COMWIT_CLOUD_TOKEN` values. They\n  stay in the ignored/untracked `.env`;\n  neither is copied into tracked source. Never print the token.',
      '- A Drizzle database is connected (AGENTS.md § Database). Verify\n  `src/server/db/index.ts` and `drizzle.config.ts` exist and `.env` contains a\n  non-empty `DATABASE_URL` (plus any driver token). They stay in the\n  ignored/untracked `.env`; nothing is copied into tracked source. Never print\n  a token.',
    ],
    [
      'move it to deployment env or pass it through MCP tool arguments.',
      'move it to deployment env or pass it through tool arguments.',
    ],
    [
      '  must not leak between warm brrrd isolate requests. The shared libSQL client\n  itself is app-runtime scoped and may remain lazy and reusable.',
      '  must not leak between warm serverless isolate requests. The shared database\n  client itself is app-runtime scoped and may remain lazy and reusable.',
    ],
    [
      '### 10. Restart dev server\n\n```bash\n.tools/start-dev-server.sh 3000\n```',
      '### 10. Restart dev server\n\n```bash\npnpm run dev\n```',
    ],
    [
      '- **Runtime lifetime**: keep Better Auth request-cached. The libSQL client may\n  be reused because its URL/token are app-runtime configuration, not a\n  request-scoped binding.',
      '- **Runtime lifetime**: keep Better Auth request-cached. The database client\n  may be reused because its URL/token are app-runtime configuration, not a\n  request-scoped binding.',
    ],
  ],
  '.claude/skills/auth-setup/SKILL.md': [
    [
      'description: Install Better Auth on Drizzle + Comwit Cloud libSQL for one or more services. Triggers - "인증 설정", "로그인", "회원가입", "auth 추가". Requires a connected Comwit Cloud database (Comwit MCP `setup_database`) first.',
      'description: Install Better Auth on Drizzle for one or more services. Triggers - "인증 설정", "로그인", "회원가입", "auth 추가". Requires a connected Drizzle database (AGENTS.md § Database) first.',
    ],
  ],
  '.agents/skills/auth-setup/assets/auth-server.ts.ref': [
    [
      '// brrrd isolate requests. The underlying libSQL connection uses app env.',
      '// serverless isolate requests. The underlying database connection uses app env.',
    ],
  ],
  '.agents/skills/seo-optimize/SKILL.md': [
    [
      '- `config.SITE_URL`은 배포 주소다. 기본값은 Comwit 앱 기본 주소\n  `https://<COMWIT_APP에서 svc_를 뺀 값>.app.comwit.link`이고, 커스텀 도메인을 붙이면 `src/server/config.ts`의 그 줄만 바꾼다.',
      '- `config.SITE_URL`은 배포 주소다. 배포 환경(필요하면 로컬 `.env`)의 `SITE_URL` 변수에서 읽으며, 도메인이 바뀌면 그 값만 바꾼다.',
    ],
  ],
  // refactoring: mock → DB 워크플로는 유지하되 DB/Storage 연결 방법을 프로젝트 규칙으로 돌린다.
  '.agents/skills/refactoring/SKILL.md': [
    [
      'description: Run the Comwit project refactoring workflow.',
      'description: Run the project refactoring workflow.',
    ],
    ['# Comwit Refactoring\n', '# Refactoring\n'],
    [
      'Run `references/step0.md`. It connects the Comwit Cloud database through the\nComwit MCP `setup_database` tool and invokes `auth-setup` when their\nprerequisites are missing.',
      'Run `references/step0.md`. It connects the database (AGENTS.md § Database)\nand invokes `auth-setup` when their prerequisites are missing.',
    ],
  ],
  '.agents/skills/refactoring/assets/SKILL-maintenance.md': [
    [
      'description: Run the Comwit project refactoring workflow.',
      'description: Run the project refactoring workflow.',
    ],
    ['# Comwit Refactoring: Maintenance Mode', '# Refactoring: Maintenance Mode'],
  ],
  '.claude/skills/refactoring/SKILL.md': [
    [
      'description: Run the Comwit project refactoring workflow.',
      'description: Run the project refactoring workflow.',
    ],
  ],
  '.agents/workflows/refactoring.md': [
    [
      'description: Run the Comwit project refactoring workflow only when',
      'description: Run the project refactoring workflow only when',
    ],
    ['# Comwit Refactoring\n', '# Refactoring\n'],
  ],
  '.agents/skills/refactoring/agents/openai.yaml': [
    [
      'to run the Comwit refactoring workflow on this project.',
      'to run the refactoring workflow on this project.',
    ],
  ],
  '.agents/skills/refactoring/references/step0.md': [
    [
      "- Connect the database through the Comwit MCP: call `setup_database`,\n  run the returned `nextSteps` command exactly as\n  given, then write the confirmed schema and run `pnpm drizzle-kit generate` /\n  `pnpm drizzle-kit migrate` with the user's approval",
      "- Connect a database following AGENTS.md § Database (Drizzle client in\n  `src/server/db/index.ts`, `drizzle.config.ts` at the root, `DATABASE_URL` in\n  `.env`), then write the confirmed schema and run `pnpm drizzle-kit generate` /\n  `pnpm drizzle-kit migrate` with the user's approval",
    ],
    [
      'honor the explicit user checkpoint before creating a new Cloud resource\n  (database name) or applying a migration.',
      'honor the explicit user checkpoint before creating a new database or\n  applying a migration.',
    ],
  ],
  '.agents/skills/refactoring/references/step1.md': [
    [
      '- Image upload uses the Comwit Storage presign integration (if needed, connect\n  it through the Comwit MCP `setup_storage` tool and its `nextSteps` command)',
      '- Image upload uses the project storage presign integration (if needed, connect\n  a bucket following AGENTS.md § Storage)',
    ],
  ],
  '.agents/skills/refactoring/references/step3.md': [
    [
      '#### 7.1 Resolve the selected Comwit database\n\nConfirm the connected database through the Comwit MCP `list_cloud_resources`\ntool. It reports the exact server binding and its current\nenv without exposing tokens; if `.env` lacks the DB group, run the command from\nthe response `nextSteps`. Continue only after a ready database result.\nMissing, ambiguous, not-ready or conflicting bindings stop seed work. Never infer\nan ID, create a database merely for seeding, or call Cloud management APIs directly.',
      '#### 7.1 Resolve the connected database\n\nConfirm that `.env` holds the `DATABASE_URL` (and driver token) the Drizzle\nclient reads, without printing them, and that the migration from step 7 was\napplied. Continue only when the database is reachable. A missing or ambiguous\nconnection stops seed work; never invent a connection string or create a\ndatabase merely for seeding.',
    ],
    [
      'Run idempotent seed logic through a project-owned server-only script using the\nconfigured Drizzle client. Never use the Comwit CLI, Wrangler, D1 bindings, a\ndirect Cloud management request, or a legacy database token. If the data plane\ndoes not accept `COMWIT_CLOUD_TOKEN`, report the explicit pending contract and\nstop without claiming seed success.',
      'Run idempotent seed logic through a project-owned server-only script using the\nconfigured Drizzle client. Never seed through an ad-hoc CLI, a raw driver\noutside the Drizzle client, or a hand-edited database. If the database rejects\nthe configured credentials, report it and stop without claiming seed success.',
    ],
  ],
  '.agents/skills/refactoring/references/step4.md': [
    [
      '- Image upload needed → Comwit MCP `setup_storage` + its `nextSteps` command (Comwit Storage)',
      '- Image upload needed → connect a bucket following AGENTS.md § Storage',
    ],
    [
      '- DB needed but not set up → Comwit MCP `setup_database` + its `nextSteps` command',
      '- DB needed but not set up → connect a database following AGENTS.md § Database',
    ],
  ],
}

function applyPatch(rel, text) {
  const patch = PATCHES[rel]
  if (!patch) return text
  if (typeof patch === 'function') return patch(text)
  for (const [from, to] of patch) {
    const parts = text.split(from)
    if (parts.length !== 2)
      die(
        `${rel}: expected exactly one occurrence of\n${from}\n(found ${parts.length - 1}) — the upstream template changed; update PATCHES`
      )
    text = parts.join(to)
  }
  return text
}

// ── walk ────────────────────────────────────────────────────────────────
function walk(dir, filter = excluded, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    const rel = relative(base, abs).split('\\').join('/')
    if (entry.isDirectory()) {
      if (!filter(`${rel}/`)) walk(abs, filter, base, out)
    } else if (!filter(rel)) out.push(rel)
  }
  return out
}

// ── main ────────────────────────────────────────────────────────────────
for (const marker of ['package.json', 'AGENTS.md', 'src/services/.ai.md']) {
  if (!existsSync(join(source, marker)))
    die(`${source} is not a comwit-template checkout (missing ${marker})`)
}
const files = walk(source)
const overrides = walk(OVERRIDES, (rel) => rel.endsWith('.DS_Store'))
const seenPatches = new Set()

console.log(`source   ${source}`)
console.log(
  `files    ${files.length} copied · ${overrides.length} overrides · ${Object.keys(PATCHES).length} patched`
)
if (dry) {
  console.log(files.map((f) => `  ${PATCHES[f] ? '~' : ' '} ${f}`).join('\n'))
  console.log(overrides.map((f) => `  + ${f} (override)`).join('\n'))
  process.exit(0)
}

rmSync(OUT, { recursive: true, force: true })
for (const rel of files) {
  const from = join(source, rel)
  const to = join(OUT, rel)
  mkdirSync(dirname(to), { recursive: true })
  if (PATCHES[rel]) {
    seenPatches.add(rel)
    writeFileSync(to, applyPatch(rel, readFileSync(from, 'utf8')))
  } else writeFileSync(to, readFileSync(from))
}
for (const rel of Object.keys(PATCHES)) {
  if (!seenPatches.has(rel)) die(`patched file ${rel} no longer exists upstream — update PATCHES`)
}
for (const rel of overrides) {
  const to = join(OUT, rel)
  mkdirSync(dirname(to), { recursive: true })
  writeFileSync(to, readFileSync(join(OVERRIDES, rel)))
}

// 어느 원본에서 왔는지만 남긴다(경로·토큰 없음).
const git = (...args) => {
  try {
    return execFileSync('git', ['-C', source, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}
const state = {
  commit: git('rev-parse', 'HEAD'),
  branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
  dirty: (git('status', '--porcelain') ?? '') !== '',
  syncedAt: new Date().toLocaleDateString('sv'), // local YYYY-MM-DD
  files: files.length + overrides.length,
}
writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`)

const problems = verifyTemplate(OUT)
if (problems.length) {
  console.error(problems.map((p) => `✖ ${p}`).join('\n'))
  die(
    'the snapshot still carries infrastructure-specific content — extend EXCLUDE/PATCHES/overrides'
  )
}
console.log(
  `✔ template synced from ${state.commit?.slice(0, 7) ?? 'unknown'}${state.dirty ? ' (working tree had local changes)' : ''}`
)
