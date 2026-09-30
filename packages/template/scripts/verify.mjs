#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// verify.mjs — 체크인된 템플릿 스냅샷이 "가치 중립" 계약을 지키는지 검사한다.
//   · 특정 인프라(클라우드 프로비저닝·배포 파이프라인·호스팅 샌드박스)의 토큰이 남아 있지 않다
//   · 꼭 있어야 할 파일(가이드·스킬·설정)이 있고, 빠져야 할 파일이 없다
//   · .claude/skills 스텁이 .agents/skills 와 1:1 로 맞는다(프론트매터 동일)
// sync.mjs 가 끝에서 호출하고, `pnpm test` 가 원본 없이도 돌린다.
// ─────────────────────────────────────────────────────────────────────────
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// 라이브러리 참조(@comwit/state · comwit-ui · comwit.json · library.comwit.io)는 허용 — 이 템플릿의 제품이다.
const FORBIDDEN = [
  [/COMWIT_[A-Z]/, 'platform environment variable'],
  [/__COMWIT_/, 'platform build define'],
  [/NEXT_PUBLIC_COMWIT/, 'platform public env'],
  [/@brrrd\//, 'platform build adapter'],
  [/\bbrrrd\b/i, 'platform runtime'],
  [/mvpstar/i, 'hosting sandbox'],
  [/Comwit Cloud/, 'cloud provisioning'],
  [/Comwit MCP|컴윗 MCP/, 'cloud provisioning tool'],
  [/setup_database|setup_storage|list_cloud_resources/, 'cloud provisioning tool'],
  [/comwit deploy|comwit login/, 'platform CLI'],
  [/app\.comwit\.link/, 'platform hosting domain'],
  [/\.tools\//, 'sandbox dev scripts'],
  [/\bsandbox\b/i, 'hosting sandbox'],
  [/react-grab/, 'sandbox element picker'],
]
const TEXT = /\.(md|mdx|txt|json|yaml|yml|ts|tsx|js|mjs|cjs|css|sh|ref|dbml|example)$/
const REQUIRED = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  '_gitignore',
  '.env.example',
  'package.json',
  'comwit.json',
  'next.config.ts',
  'src/app/.ai.md',
  'src/services/.ai.md',
  'src/services/api.ai.md',
  'src/services/state.ai.md',
  'src/services/page.ai.md',
  'src/services/design.md',
  'src/server/repository/.ai.md',
  'src/app/comwit-tokens.css',
  '.agents/skills/app-setup/SKILL.md',
  '.agents/skills/auth-setup/SKILL.md',
  '.agents/skills/seo-optimize/SKILL.md',
  '.agents/skills/refactoring/SKILL.md',
  '.agents/scripts/cleanup-skill.mjs',
  'eslint-rules/index.cjs',
]
const ABSENT = [
  '.git',
  '.gitignore',
  '.gitea',
  '.tools',
  '.mcp.json',
  'contracts',
  'pnpm-lock.yaml',
  'node_modules',
  '.next',
  '.agents/scaffolds',
  '.agents/fragments',
  'src/instrumentation.ts',
  'src/lib/components/sandbox-bridge.tsx',
  'src/services/app/page/vibe-coding-user-guide',
]

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) walk(abs, base, out)
    else out.push(relative(base, abs).split('\\').join('/'))
  }
  return out
}

function frontmatter(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)?.[1].trim() ?? null
}

/** @returns {string[]} problems (empty when the snapshot is clean) */
export function verifyTemplate(root) {
  const problems = []
  if (!existsSync(root)) return [`template directory is missing: ${root}`]
  for (const rel of REQUIRED)
    if (!existsSync(join(root, rel))) problems.push(`missing required file ${rel}`)
  for (const rel of ABSENT)
    if (existsSync(join(root, rel))) problems.push(`${rel} must not be in the template`)

  for (const rel of walk(root)) {
    if (!TEXT.test(rel) && !rel.endsWith('.ai.md') && rel !== '_gitignore') continue
    const text = readFileSync(join(root, rel), 'utf8')
    for (const [pattern, why] of FORBIDDEN) {
      const match = text.match(pattern)
      if (match) {
        const line = text.slice(0, match.index).split('\n').length
        problems.push(`${rel}:${line} contains ${why} (${JSON.stringify(match[0])})`)
      }
    }
  }

  const pkgPath = join(root, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (pkg.name !== 'my-app')
      problems.push(`package.json name should be the placeholder "my-app", got ${pkg.name}`)
    if (pkg.id) problems.push('package.json still carries a platform session id')
    if (pkg.scripts?.dev !== 'next dev')
      problems.push(`package.json dev script should be "next dev", got ${pkg.scripts?.dev}`)
  }

  const agents = join(root, '.agents/skills')
  const claude = join(root, '.claude/skills')
  const list = (dir) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((n) => !n.startsWith('.'))
          .sort()
      : []
  const canonical = list(agents)
  const stubs = list(claude)
  if (canonical.join() !== stubs.join())
    problems.push(
      `.claude/skills (${stubs.join(', ')}) must mirror .agents/skills (${canonical.join(', ')})`
    )
  for (const name of canonical) {
    const src = join(agents, name, 'SKILL.md')
    const stub = join(claude, name, 'SKILL.md')
    if (!existsSync(src) || !existsSync(stub)) continue
    if (frontmatter(readFileSync(src, 'utf8')) !== frontmatter(readFileSync(stub, 'utf8')))
      problems.push(`skill frontmatter differs between .agents and .claude for ${name}`)
  }
  return problems
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'template')
  const problems = verifyTemplate(root)
  if (problems.length) {
    console.error(problems.map((p) => `✖ ${p}`).join('\n'))
    process.exit(1)
  }
  console.log(`✔ template snapshot is clean (${root})`)
}
