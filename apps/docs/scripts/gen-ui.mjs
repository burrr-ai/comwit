// ─────────────────────────────────────────────────────────────────────────
// docs 코드젠 — 단일 소스에서 문서 데이터를 뽑는다(컴포넌트 코드 복제 없음).
//   · 배치:   content/ui/gallery.mjs (그룹 · 순서 · 한 줄 요약)
//   · 예시:   storybook specs/*.mjs → 라이브 예시 모듈 + 복붙 코드
//   · 소스/deps/CLI/파트: packages/ui/cli/registry/*.json
//   · 토큰:   packages/ui/templates/src/styles/globals.css (:root / .dark)
// 산출: app/ui/_generated/{catalog.ts, examples/<name>.tsx, examples/index.tsx}
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { groups, credits, engineCredits } from '../content/ui/gallery.mjs'

const here = dirname(fileURLToPath(import.meta.url)) // apps/docs/scripts
const docsRoot = join(here, '..')
const repoRoot = join(here, '..', '..', '..')
const specsDir = join(repoRoot, 'apps', 'storybook', 'specs')
const registryDir = join(repoRoot, 'packages', 'ui', 'cli', 'registry')
const templatesUi = join(repoRoot, 'packages', 'ui', 'templates', 'src', 'components', 'ui')
const tokensCss = join(repoRoot, 'packages', 'ui', 'templates', 'src', 'styles', 'globals.css')
const genDir = join(docsRoot, 'app', 'ui', '_generated')
const exDir = join(genDir, 'examples')

const ident = (n) => 'ex_' + n.replace(/[^a-zA-Z0-9]/g, '_')
const indent = (code, pad) =>
  code
    .trim()
    .split('\n')
    .map((l) => (l ? pad + l : l))
    .join('\n')

/* ── 1. specs (slug/covers 로 컴포넌트에 매핑) ── */
const specsByName = {}
for (const f of readdirSync(specsDir).filter((f) => f.endsWith('.mjs'))) {
  const mod = await import(pathToFileURL(join(specsDir, f)).href)
  const arr = Array.isArray(mod.specs) ? mod.specs : mod.spec ? [mod.spec] : []
  for (const spec of arr) {
    const keys = new Set(
      [spec.slug, ...(spec.covers ?? []), spec.title?.toLowerCase()].filter(Boolean)
    )
    for (const k of keys) if (!specsByName[k]) specsByName[k] = spec
  }
}

/* ── 2. registry (소스/deps) + 파트(export 목록) + 소비 토큰 ── */
function registryOf(name) {
  const p = join(registryDir, `${name}.json`)
  if (!existsSync(p)) return { npmDeps: [], registryDeps: [], source: '', path: '' }
  const r = JSON.parse(readFileSync(p, 'utf8'))
  return {
    npmDeps: r.dependencies ?? [],
    registryDeps: r.registryDependencies ?? [],
    source: r.files?.[0]?.content ?? '',
    path: r.files?.[0]?.path ?? '',
  }
}

/** 공개 컴포넌트/함수 이름 — `export { A, B }` 와 `export function A` 를 모두 본다. */
function exportedParts(source) {
  const names = new Set()
  for (const m of source.matchAll(/^export\s*\{([^}]*)\}/gm))
    for (const raw of m[1].split(','))
      if (raw.trim() && !raw.trim().startsWith('type '))
        names.add(
          raw
            .trim()
            .split(/\s+as\s+/)
            .pop()
        )
  for (const m of source.matchAll(/^export\s+(?:function|const)\s+(\w+)/gm)) names.add(m[1])
  return [...names].filter((n) => /^[A-Za-z]/.test(n) && !/Variants$/.test(n))
}

/* ── 3. 토큰 (L0 프리미티브·노브 + L1 시맨틱, 라이트/다크 동시)
   주석을 먼저 지우고 실제 at-rule 을 기준으로 자른다(주석 속 "@theme" 글자에 속지 않게). ── */
const css = readFileSync(tokensCss, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
function parseTokens() {
  const cut = css.search(/^@theme\b/m)
  const prefix = cut === -1 ? css : css.slice(0, cut)
  const rules = []
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g
  let r
  while ((r = ruleRe.exec(prefix))) {
    // 첫 규칙 앞의 @import·@custom-variant 문장은 셀렉터가 아니다 — 마지막 `;` 뒤만 셀렉터다.
    rules.push({ selector: r[1].split(';').pop().trim().replace(/\s+/g, ' '), body: r[2] })
  }
  const decls = (body) => {
    const out = {}
    const re = /--([\w-]+):\s*([^;]+);/g
    let m
    while ((m = re.exec(body))) out[m[1]] = m[2].trim().replace(/\s+/g, ' ')
    return out
  }
  const light = {}
  const dark = {}
  const semantic = new Set()
  for (const { selector, body } of rules) {
    const d = decls(body)
    const isRoot = /(^|,\s*):root(\s*,|$)/.test(selector)
    const isDark = /(^|,\s*)\.dark(\s*,|$)/.test(selector)
    if (isRoot) Object.assign(light, d)
    if (isDark) Object.assign(dark, d)
    if (isRoot && isDark) for (const k of Object.keys(d)) semantic.add(k)
  }
  // alias(`var(--ink)`)를 실제 값으로 풀어 스와치가 색을 그릴 수 있게 한다
  const resolve = (value, vars, depth = 0) =>
    depth > 6
      ? value
      : value?.replace(/var\(--([\w-]+)\)/g, (all, n) =>
          vars[n] ? resolve(vars[n], vars, depth + 1) : all
        )
  const darkVars = { ...light, ...dark }
  return Object.keys(light).map((name) => {
    const value = resolve(light[name], light)
    const darkValue = resolve(dark[name] ?? light[name], darkVars)
    return {
      name,
      value,
      dark: darkValue,
      raw: light[name],
      layer: semantic.has(name) ? 'semantic' : 'primitive',
      isColor: /^(#|rgb|hsl|oklch)/i.test(value),
      group: tokenGroup(name, semantic.has(name)),
    }
  })
}
function tokenGroup(name, isSemantic) {
  if (/^(success|warning|destructive|info)/.test(name)) return 'Status'
  if (name.startsWith('glass')) return 'Glass'
  if (isSemantic) return 'Semantic'
  if (/^(canvas|surface|fill|ink|brand|line)/.test(name)) return 'Palette'
  if (/radius|border-width|focus-ring|field-ring|spacing/.test(name)) return 'Shape'
  if (/^(display-font|weight-|text-scale|tracking-scale)/.test(name)) return 'Type'
  if (/^(duration|press-scale|ripple|state-)/.test(name)) return 'Motion'
  if (name.startsWith('elevation')) return 'Elevation'
  if (name.startsWith('z-')) return 'Layers'
  return 'Sizes'
}

// 유틸 → 토큰 이름. bg-primary/90 → primary · rounded-card → radius card · shadow-panel …
const colorNames = new Set([...css.matchAll(/--color-([\w-]+):/g)].map((m) => m[1]))
function tokensUsed(source) {
  const color = new Set()
  const scale = new Set()
  const re =
    /(?:^|[\s"'`:])(?:bg|text|border(?:-[trbl])?|ring|ring-offset|outline|fill|stroke|divide|from|to|via|placeholder|decoration|caret|accent)-([a-z][\w-]*?)(?:\/\d+)?(?=[\s"'`\]]|$)/g
  for (const m of source.matchAll(re)) if (colorNames.has(m[1])) color.add(m[1])
  for (const m of source.matchAll(/\brounded-(?:[trbl]{1,2}-)?(control|card|sheet|pill)\b/g))
    scale.add(`rounded-${m[1]}`)
  for (const m of source.matchAll(/\bshadow-(card-hover|card|panel|message|raised)\b/g))
    scale.add(`shadow-${m[1]}`)
  for (const m of source.matchAll(/\b(duration-(?:instant|fast|base|slow|slower))\b/g))
    scale.add(m[1])
  for (const m of source.matchAll(
    /\btext-(display-(?:xl|lg|md|sm)|title-(?:lg|md|sm)|body-sm|body|label|caption|micro)\b/g
  ))
    scale.add(`text-${m[1]}`)
  if (/\bglass\b|<Glass\b|GlassSurface|GlassButton/.test(source)) scale.add('glass')
  return { colorTokens: [...color].sort(), scaleTokens: [...scale].sort() }
}

/* ── 4. 예시 모듈 ── */
function renderExpr(story) {
  if (story.renderFn) return `() => {\n${indent(story.renderFn, '    ')}\n  }`
  const r = story.render
  return r.includes('\n') ? `() => (\n${indent(r, '      ')}\n    )` : `() => (${r.trim()})`
}
function codeOf(story, spec = {}) {
  const imports = (spec.imports ?? [])
    .map(
      (im) =>
        `import { ${im.names.join(', ')} } from '${im.from
          .replace('@comwit/ui-templates/lib/', '@/lib/')
          .replace('@comwit/ui-templates/', '@/components/ui/')}'`
    )
    .join('\n')
  const extra = (spec.extraImports ?? []).join('\n')
  const needsReact = /React\./.test(story.renderFn ?? story.render ?? '')
  const reactImport =
    !needsReact || /from ['"]react['"]/.test(extra) ? '' : "import * as React from 'react'"
  const body = story.renderFn
    ? story.renderFn.trim()
    : `return (\n${indent(story.render ?? '', '  ')}\n)`
  return [
    "'use client'",
    [reactImport, extra, imports].filter(Boolean).join('\n'),
    `export default function Example() {\n  ${body.replace(/\n/g, '\n  ')}\n}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}
function buildExampleModule(spec) {
  const importLines = (spec.imports ?? [])
    .map((im) => `import { ${im.names.join(', ')} } from '${im.from}'`)
    .join('\n')
  const extraArr = spec.extraImports ?? []
  const reactImport = extraArr.some((l) => /from ['"]react['"]/.test(l))
    ? ''
    : "import * as React from 'react'\n"
  const items = (spec.stories ?? [])
    .map((s) => {
      const desc = s.description ? `\n    description: ${JSON.stringify(s.description)},` : ''
      return `  {\n    name: ${JSON.stringify(s.name)},${desc}\n    gallery: ${Boolean(s.gallery)},\n    code: ${JSON.stringify(codeOf(s, spec))},\n    Render: ${renderExpr(s)},\n  },`
    })
    .join('\n')
  return `'use client'
// AUTO-GENERATED by scripts/gen-ui.mjs — DO NOT EDIT. Edit apps/storybook/specs/*.mjs instead.
/* eslint-disable */
${reactImport}${importLines}${extraArr.length ? '\n' + extraArr.join('\n') : ''}

export const examples = [
${items}
]
`
}

/* ── 5. 조립 ── */
rmSync(genDir, { recursive: true, force: true })
mkdirSync(exDir, { recursive: true })

const tokens = parseTokens()
const withExamples = []
const components = []
for (const group of groups) {
  for (const item of group.items) {
    const spec = specsByName[item.name]
    const reg = registryOf(item.name)
    const stories = spec?.stories ?? []
    const galleryIndex = Math.max(
      0,
      stories.findIndex((s) => s.gallery)
    )
    if (spec) {
      writeFileSync(join(exDir, `${item.name}.tsx`), buildExampleModule(spec))
      withExamples.push(item.name)
    }
    const isLib = reg.path.startsWith('lib/') || reg.path.startsWith('hooks/')
    components.push({
      name: item.name,
      title: item.title,
      summary: item.summary,
      group: group.id,
      exhibit: item.exhibit ?? 'card',
      cli: `npx comwit-ui add ${item.name}`,
      importFrom: isLib ? `@/${reg.path.replace(/\.tsx?$/, '')}` : `@/components/ui/${item.name}`,
      parts: exportedParts(reg.source),
      ...tokensUsed(reg.source),
      npmDeps: reg.npmDeps,
      registryDeps: reg.registryDeps,
      // 큐레이팅 크레딧 — 이 컴포넌트가 직접 의존하는 라이브러리 + 엔진(@comwit/ui)이 대신 감싼 라이브러리.
      credits: [
        ...new Set(
          [...reg.npmDeps, ...(engineCredits[item.name] ?? [])]
            .map((d) => credits[d])
            .filter(Boolean)
        ),
      ],
      source: reg.source,
      galleryIndex,
      examples: stories.map((s) => ({
        name: s.name,
        ...(s.description ? { description: s.description } : {}),
        code: codeOf(s, spec),
      })),
    })
  }
}

// 커버리지 — 갤러리에 빠진 템플릿 컴포넌트 / 없는 이름 / 예시 없는 항목을 알린다.
const listed = new Set(components.map((c) => c.name))
const templates = readdirSync(templatesUi)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => f.replace(/\.tsx$/, ''))
const unlisted = templates.filter((n) => !listed.has(n))
const unknown = components.filter((c) => !c.source).map((c) => c.name)
const noExamples = components.filter((c) => !c.examples.length).map((c) => c.name)
if (unlisted.length) console.warn(`  ⚠ gallery.mjs 에 없는 템플릿: ${unlisted.join(', ')}`)
if (unknown.length) console.warn(`  ⚠ registry 에 없는 갤러리 항목: ${unknown.join(', ')}`)
if (noExamples.length) console.warn(`  ⚠ 예시(spec) 없는 항목: ${noExamples.join(', ')}`)

// 토큰 → 컴포넌트 역인덱스
const tokenMap = {}
for (const c of components) {
  for (const t of [...c.colorTokens, ...c.scaleTokens]) (tokenMap[t] ??= []).push(c.name)
}

/* ── 6. examples/index.tsx (라이브 렌더 맵) ── */
writeFileSync(
  join(exDir, 'index.tsx'),
  `'use client'
// AUTO-GENERATED by scripts/gen-ui.mjs — DO NOT EDIT.
import type { ComponentType } from 'react'
${withExamples.map((n) => `import { examples as ${ident(n)} } from './${n}'`).join('\n')}

export type LiveExample = {
  name: string
  description?: string
  gallery: boolean
  code: string
  Render: ComponentType
}
export const EXAMPLES: Record<string, LiveExample[]> = {
${withExamples.map((n) => `  ${JSON.stringify(n)}: ${ident(n)},`).join('\n')}
}
`
)

/* ── 7. catalog.ts (서버-세이프 데이터) ── */
writeFileSync(
  join(genDir, 'catalog.ts'),
  `// AUTO-GENERATED by scripts/gen-ui.mjs — DO NOT EDIT.
export type ExampleMeta = { name: string; description?: string; code: string }
export type Component = {
  name: string
  title: string
  summary: string
  group: string
  exhibit: 'card' | 'wide' | 'phone'
  cli: string
  importFrom: string
  parts: string[]
  colorTokens: string[]
  scaleTokens: string[]
  npmDeps: string[]
  registryDeps: string[]
  /** Curated libraries this component is built on (from its npm dependencies). */
  credits: { label: string; href: string }[]
  source: string
  galleryIndex: number
  examples: ExampleMeta[]
}
export type Group = {
  id: string
  title: string
  blurb: string
  specimen: boolean
  items: string[]
}
/** value/dark 는 alias(var(--ink))를 실제 값으로 푼 결과. raw 는 선언 원문. */
export type TokenDef = {
  name: string
  value: string
  dark: string
  raw: string
  layer: 'primitive' | 'semantic'
  isColor: boolean
  group: string
}

export const groups: Group[] = ${JSON.stringify(
    groups.map((g) => ({
      id: g.id,
      title: g.title,
      blurb: g.blurb,
      specimen: Boolean(g.specimen),
      items: g.items.map((i) => i.name),
    })),
    null,
    2
  )}

export const components: Component[] = ${JSON.stringify(components, null, 2)}

export const tokens: TokenDef[] = ${JSON.stringify(tokens, null, 2)}

/** 토큰(유틸 이름) → 그 토큰을 소비하는 컴포넌트 name[] */
export const tokenMap: Record<string, string[]> = ${JSON.stringify(tokenMap, null, 2)}

export const byName: Record<string, Component> = Object.fromEntries(components.map((c) => [c.name, c]))
`
)

console.log(
  `docs: ${components.length} components in ${groups.length} groups · ${withExamples.length} with live examples · ${tokens.length} tokens`
)
