// ─────────────────────────────────────────────────────────────────────────
// docs 코드젠 — 단일 소스에서 문서 데이터를 뽑는다(컴포넌트 코드 복제 없음).
//   · 예시:   storybook specs/*.mjs (스토리 지운 6개는 아래 FALLBACK)  → 라이브 예시 모듈 + 복붙 코드
//   · 분석:   data/analysis.json (워크플로 산출: 토큰/파트/역할)
//   · 소스/deps/CLI: packages/ui/cli/registry/*.json
//   · 토큰:   packages/ui/templates/src/styles/globals.css (:root)
// 산출: app/_generated/{catalog.ts, examples/<name>.tsx, examples/index.tsx}
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url)) // apps/docs/scripts
const docsRoot = join(here, '..')
const repoRoot = join(here, '..', '..', '..')
const specsDir = join(repoRoot, 'apps', 'storybook', 'specs')
const registryDir = join(repoRoot, 'packages', 'ui', 'cli', 'registry')
const tokensCss = join(repoRoot, 'packages', 'ui', 'templates', 'src', 'styles', 'globals.css')
const analysisPath = join(docsRoot, 'content', 'ui', 'analysis.json')
const genDir = join(docsRoot, 'app', 'ui', '_generated')
const exDir = join(genDir, 'examples')

const ident = (n) => 'ex_' + n.replace(/[^a-zA-Z0-9]/g, '_')
const indent = (code, pad) =>
  code
    .trim()
    .split('\n')
    .map((l) => (l ? pad + l : l))
    .join('\n')

/* ── 스토리 지운(=순수 토큰) 컴포넌트용 최소 예시 (build 안전한 API 만 사용) ── */
const FALLBACK = {
  separator: {
    imports: [{ from: '@comwit/ui-templates/separator', names: ['Separator'] }],
    stories: [
      {
        name: 'Horizontal',
        render: `<div className="text-body-sm text-muted-foreground">\n  <p className="text-foreground">계정</p>\n  <Separator className="my-3" />\n  <p className="text-foreground">알림</p>\n</div>`,
      },
      {
        name: 'Vertical',
        render: `<div className="flex h-5 items-center gap-3 text-body-sm">\n  <span>홈</span>\n  <Separator orientation="vertical" />\n  <span>문서</span>\n  <Separator orientation="vertical" />\n  <span>설정</span>\n</div>`,
      },
    ],
  },
  label: {
    imports: [
      { from: '@comwit/ui-templates/label', names: ['Label'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
    ],
    stories: [
      {
        name: 'Default',
        render: `<div className="grid max-w-xs gap-2">\n  <Label htmlFor="email">이메일</Label>\n  <Input id="email" placeholder="you@example.com" />\n</div>`,
      },
    ],
  },
  skeleton: {
    imports: [{ from: '@comwit/ui-templates/skeleton', names: ['Skeleton'] }],
    stories: [
      {
        name: 'Default',
        render: `<div className="flex items-center gap-4">\n  <Skeleton className="size-12 rounded-full" />\n  <div className="grid gap-2">\n    <Skeleton className="h-4 w-[180px]" />\n    <Skeleton className="h-4 w-[120px]" />\n  </div>\n</div>`,
      },
    ],
  },
  badge: {
    imports: [{ from: '@comwit/ui-templates/badge', names: ['Badge'] }],
    stories: [
      {
        name: 'Variants',
        description: 'default · secondary · destructive · outline',
        render: `<div className="flex flex-wrap items-center gap-2">\n  <Badge>기본</Badge>\n  <Badge variant="secondary">보조</Badge>\n  <Badge variant="destructive">위험</Badge>\n  <Badge variant="outline">외곽선</Badge>\n</div>`,
      },
    ],
  },
  card: {
    imports: [
      {
        from: '@comwit/ui-templates/card',
        names: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    stories: [
      {
        name: 'Default',
        render: `<Card className="w-80">\n  <CardHeader>\n    <CardTitle>알림 설정</CardTitle>\n    <CardDescription>받을 알림을 선택하세요.</CardDescription>\n  </CardHeader>\n  <CardContent className="text-body-sm text-muted-foreground">\n    이메일과 푸시 알림을 개별적으로 켜고 끌 수 있습니다.\n  </CardContent>\n  <CardFooter>\n    <Button className="w-full">저장</Button>\n  </CardFooter>\n</Card>`,
      },
    ],
  },
  alert: {
    imports: [
      { from: '@comwit/ui-templates/alert', names: ['Alert', 'AlertTitle', 'AlertDescription'] },
    ],
    stories: [
      {
        name: 'Default',
        render: `<Alert className="flex-col gap-2">\n  <AlertTitle>안내</AlertTitle>\n  <AlertDescription>변경사항이 저장되었습니다.</AlertDescription>\n</Alert>`,
      },
      {
        name: 'Destructive',
        render: `<Alert tone="destructive" className="flex-col gap-2">\n  <AlertTitle>오류</AlertTitle>\n  <AlertDescription>결제 정보를 확인해 주세요.</AlertDescription>\n</Alert>`,
      },
    ],
  },
}

/* ── 1. analysis (마스터 목록) ── */
const analysis = JSON.parse(readFileSync(analysisPath, 'utf8'))

/* ── 2. specs 로드 (covers/slug 로 컴포넌트에 매핑) ── */
const specsByComp = {}
for (const f of readdirSync(specsDir).filter((f) => f.endsWith('.mjs'))) {
  const mod = await import(pathToFileURL(join(specsDir, f)).href)
  const arr = Array.isArray(mod.specs) ? mod.specs : mod.spec ? [mod.spec] : []
  for (const spec of arr) {
    const keys = new Set(
      [spec.slug, ...(spec.covers ?? []), spec.title?.toLowerCase()].filter(Boolean)
    )
    for (const k of keys) if (!specsByComp[k]) specsByComp[k] = spec
  }
}
// fallback (스토리 없는 컴포넌트)
for (const [name, spec] of Object.entries(FALLBACK))
  if (!specsByComp[name]) specsByComp[name] = spec

/* ── 3. registry (소스/deps) ── */
function registryOf(name) {
  const p = join(registryDir, `${name}.json`)
  if (!existsSync(p)) return { npmDeps: [], registryDeps: [], source: '' }
  const r = JSON.parse(readFileSync(p, 'utf8'))
  return {
    npmDeps: r.dependencies ?? [],
    registryDeps: r.registryDependencies ?? [],
    source: r.files?.[0]?.content ?? '',
  }
}

/* ── 4. 토큰 (globals.css 의 L0 노브 + L1 시맨틱, 라이트/다크 동시)
   주의: 예전엔 `css.split('@theme')[0]` 로 잘랐는데, 주석에 "@theme" 이라는 글자만 있어도
   전체가 잘려 토큰 0개가 나왔다. 주석을 먼저 지우고 **실제 at-rule** 을 기준으로 자른다. ── */
function parseTokens() {
  const css = readFileSync(tokensCss, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const cut = css.search(/^@theme\b/m)
  const prefix = cut === -1 ? css : css.slice(0, cut)

  // 최상위 `selector { decls }` 수집 (이 구간엔 중첩 블록이 없다)
  const rules = []
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g
  let r
  while ((r = ruleRe.exec(prefix))) {
    rules.push({ selector: r[1].trim().replace(/\s+/g, ' '), body: r[2] })
  }

  const decls = (body) => {
    const out = {}
    const re = /--([\w-]+):\s*([^;]+);/g
    let m
    while ((m = re.exec(body))) out[m[1]] = m[2].trim()
    return out
  }

  // 선언 순서대로 누적한다.
  //   `:root`        → 노브 + status + elevation(라이트)
  //   `.dark`        → 다크 램프 / elevation / status / 선 색
  //   `:root, .dark` → 시맨틱 alias (양쪽에 동시 적용)
  //   `.dark`(두번째) → 다크 전용 시맨틱 보정
  const light = {}
  const dark = {}
  for (const { selector, body } of rules) {
    const d = decls(body)
    if (selector.includes(':root')) Object.assign(light, d)
    if (/(^|,\s*)\.dark(\s*,|$)/.test(selector)) Object.assign(dark, d)
  }

  const rampOf = (vars) =>
    Object.fromEntries(Object.entries(vars).filter(([k]) => /^n-\d+$/.test(k)))
  const lightRamp = rampOf(light)
  const darkRamp = { ...lightRamp, ...rampOf(dark) }

  // alias(`var(--n-7)`)를 실제 hex 로 풀어 스와치가 색을 그릴 수 있게 한다
  const resolve = (value, ramp) => value?.replace(/var\(--(n-\d+)\)/g, (all, n) => ramp[n] ?? all)

  return Object.keys(light)
    .filter((name) => !/^n-\d+$/.test(name)) // 램프는 private — 문서에 노출하지 않는다
    .map((name) => {
      const value = resolve(light[name], lightRamp)
      const darkValue = resolve(dark[name] ?? light[name], darkRamp)
      return {
        name,
        value,
        dark: darkValue,
        isColor: /^(#|rgb|hsl|oklch)/i.test(value),
        group: tokenGroup(name),
      }
    })
}
function tokenGroup(name) {
  if (['background', 'foreground'].includes(name)) return 'Base'
  if (
    name.startsWith('card') ||
    name.startsWith('popover') ||
    name === 'overlay' ||
    name === 'surface-glass'
  )
    return 'Surface'
  if (name.startsWith('primary')) return 'Brand'
  if (
    name.startsWith('secondary') ||
    name.startsWith('muted') ||
    name.startsWith('accent') ||
    name === 'placeholder' ||
    name === 'switch-thumb'
  )
    return 'Neutral'
  if (/^(success|warning|destructive|info)/.test(name)) return 'Status'
  if (/^(border|border-strong|input|input-hover|ring)$/.test(name)) return 'Line & Focus'
  if (name.startsWith('radius') || name === 'pill-radius') return 'Radius'
  if (name.startsWith('shadow') || name.startsWith('elevation')) return 'Elevation'
  if (
    name.startsWith('duration') ||
    name.startsWith('ease') ||
    name.startsWith('press-scale') ||
    name === 'ripple-opacity'
  )
    return 'Motion'
  if (name.startsWith('state-')) return 'State'
  if (name.startsWith('z-')) return 'Layer'
  if (/^(display-font|weight-|text-scale|tracking-scale)/.test(name)) return 'Typography'
  if (/^(border-width|focus-ring|spacing|menu-min-width|picker-width)/.test(name)) return 'Knob'
  return 'Other'
}

/* ── 5. 예시 모듈 생성 ── */
function renderExpr(story) {
  if (story.renderFn) return `() => {\n${indent(story.renderFn, '    ')}\n  }`
  const r = story.render
  return r.includes('\n') ? `() => (\n${indent(r, '      ')}\n    )` : `() => (${r.trim()})`
}
function codeOf(story, spec = {}) {
  const imports = (spec.imports ?? [])
    .map(
      (im) =>
        `import { ${im.names.join(', ')} } from '${im.from.replace('@comwit/ui-templates/', '@/components/ui/')}'`
    )
    .join('\n')
  const extra = (spec.extraImports ?? []).join('\n')
  const reactImport = /import \* as React from/.test(extra) ? '' : "import * as React from 'react'"
  const body = story.renderFn ? story.renderFn.trim() : `return (${(story.render ?? '').trim()})`
  return [
    "'use client'",
    reactImport,
    imports,
    extra,
    `export default function Example() {\n${body}\n}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}
function buildExampleModule(name, spec) {
  const importLines = (spec.imports ?? [])
    .map((im) => `import { ${im.names.join(', ')} } from '${im.from}'`)
    .join('\n')
  const extraArr = spec.extraImports ?? []
  const extra = extraArr.join('\n')
  // 스펙 extraImports 가 이미 react 를 import 하면 중복을 피한다.
  const reactImport = extraArr.some((l) => /from ['"]react['"]/.test(l))
    ? ''
    : "import * as React from 'react'\n"
  const items = (spec.stories ?? [])
    .map((s) => {
      const desc = s.description ? `\n    description: ${JSON.stringify(s.description)},` : ''
      return `  {\n    name: ${JSON.stringify(s.name)},${desc}\n    code: ${JSON.stringify(codeOf(s, spec))},\n    Render: ${renderExpr(s)},\n  },`
    })
    .join('\n')
  return `'use client'
// AUTO-GENERATED by scripts/gen.mjs — DO NOT EDIT.
${reactImport}${importLines}${extra ? '\n' + extra : ''}

export const examples = [
${items}
]
`
}

/* ── 6. 조립 ── */
rmSync(genDir, { recursive: true, force: true })
mkdirSync(exDir, { recursive: true })

const tokens = parseTokens()
const withExamples = []
const components = analysis.map((a) => {
  const spec = specsByComp[a.name]
  const reg = registryOf(a.name)
  const exampleCodes = (spec?.stories ?? []).map((s) => ({
    name: s.name,
    ...(s.description ? { description: s.description } : {}),
    code: codeOf(s, spec),
  }))
  if (spec) {
    writeFileSync(join(exDir, `${a.name}.tsx`), buildExampleModule(a.name, spec))
    withExamples.push(a.name)
  }
  return {
    name: a.name,
    title: a.title,
    oneLiner: a.oneLiner,
    kind: a.kind,
    inShadcn: a.inShadcn,
    cli: `npx comwit-ui add ${a.name}`,
    importFrom: `@/components/ui/${a.name}`,
    compoundParts: a.compoundParts ?? [],
    colorTokens: a.colorTokens ?? [],
    scaleTokens: a.scaleTokens ?? [],
    npmDeps: reg.npmDeps,
    registryDeps: reg.registryDeps,
    source: reg.source,
    hasExamples: !!spec,
    examples: exampleCodes,
  }
})

// 토큰 → 컴포넌트 역인덱스 (color + scale 통합)
const tokenMap = {}
for (const c of components) {
  for (const t of [...c.colorTokens, ...c.scaleTokens]) {
    ;(tokenMap[t] ??= []).push(c.name)
  }
}

/* ── 7. examples/index.tsx (라이브 렌더 맵) ── */
const idxImports = withExamples
  .map((n) => `import { examples as ${ident(n)} } from './${n}'`)
  .join('\n')
const idxEntries = withExamples.map((n) => `  ${JSON.stringify(n)}: ${ident(n)},`).join('\n')
writeFileSync(
  join(exDir, 'index.tsx'),
  `'use client'
// AUTO-GENERATED by scripts/gen.mjs — DO NOT EDIT.
import type { ComponentType } from 'react'
${idxImports}

export type LiveExample = { name: string; description?: string; code: string; Render: ComponentType }
export const EXAMPLES: Record<string, LiveExample[]> = {
${idxEntries}
}
`
)

/* ── 8. catalog.ts (서버-세이프 데이터) ── */
writeFileSync(
  join(genDir, 'catalog.ts'),
  `// AUTO-GENERATED by scripts/gen.mjs — DO NOT EDIT.
export type ExampleMeta = { name: string; description?: string; code: string }
export type ComponentKind = 'primitive-backed' | 'token-only' | 'custom-engine'
export type Component = {
  name: string
  title: string
  oneLiner: string
  kind: ComponentKind
  inShadcn: boolean
  cli: string
  importFrom: string
  compoundParts: string[]
  colorTokens: string[]
  scaleTokens: string[]
  npmDeps: string[]
  registryDeps: string[]
  source: string
  hasExamples: boolean
  examples: ExampleMeta[]
}
/** value/dark 는 alias(var(--n-7))를 실제 값으로 푼 결과. 램프(--n-*)는 private 이라 노출하지 않는다. */
export type TokenDef = { name: string; value: string; dark: string; isColor: boolean; group: string }

export const components: Component[] = ${JSON.stringify(components, null, 2)}

export const tokens: TokenDef[] = ${JSON.stringify(tokens, null, 2)}

/** 토큰 이름 → 그 토큰을 소비하는 컴포넌트 name[] */
export const tokenMap: Record<string, string[]> = ${JSON.stringify(tokenMap, null, 2)}

export const byName: Record<string, Component> = Object.fromEntries(components.map((c) => [c.name, c]))
`
)

console.log(
  `docs: ${components.length} components · ${withExamples.length} with live examples · ${tokens.length} tokens`
)
const noEx = components.filter((c) => !c.hasExamples).map((c) => c.name)
if (noEx.length) console.log(`  (예시 없음: ${noEx.join(', ')})`)
