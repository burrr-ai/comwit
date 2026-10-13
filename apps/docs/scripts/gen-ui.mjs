// ─────────────────────────────────────────────────────────────────────────
// Generate docs from canonical sources without duplicating component implementations.
// Layout: content/ui/gallery.mjs (groups, order, and summaries).
// Examples: Storybook specs/*.mjs become live modules and copyable code.
// Source, dependencies, CLI metadata, and exports: packages/ui/cli/registry/*.json.
// Tokens: packages/ui/templates/src/styles/globals.css (:root and .dark).
// Agent guide: insert the gallery catalog into content/ui/llms-template.txt.
// Outputs: app/ui/_generated/{catalog.ts, examples/<name>.tsx, examples/index.tsx} and public/ui/llms.txt.
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

/* 1. Specs mapped to components through slug/covers. */
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

/* 2. Registry source and dependencies, exported parts, and consumed tokens. */
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

/** Read public names from both export lists and exported function declarations. */
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

/*
 * 3. Light and dark tokens: L0 primitives/controls and L1 semantics. Remove comments before splitting at actual at-rules so @theme in comments cannot match.
 */
const css = readFileSync(tokensCss, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
function parseTokens() {
  const cut = css.search(/^@theme\b/m)
  const prefix = cut === -1 ? css : css.slice(0, cut)
  const rules = []
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g
  let r
  while ((r = ruleRe.exec(prefix))) {
    // Leading @import and @custom-variant statements are not selectors; use only text after the last semicolon.
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
  // Resolve aliases such as var(--ink) to concrete swatch colors.
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

// Map utilities to tokens: bg-primary/90 to primary, rounded-card to radius-card, shadow-panel, and so on.
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

/* 4. Example modules. */
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

/* 5. Assembly. */
rmSync(genDir, { recursive: true, force: true })
mkdirSync(exDir, { recursive: true })

const tokens = parseTokens()
const withExamples = []
const components = []
// Groups and items share /ui/components#id anchors; duplicate IDs send the sidebar to the wrong place.
const itemNames = new Set(groups.flatMap((g) => g.items.map((i) => i.name)))
for (const group of groups)
  if (itemNames.has(group.id))
    throw new Error(`gallery group id "${group.id}" collides with a component anchor`)
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
      // Credits include direct component dependencies and libraries wrapped by @comwit/ui.
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

// Report template components missing from the gallery, unknown names, and entries without examples.
const listed = new Set(components.map((c) => c.name))
const templates = readdirSync(templatesUi)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => f.replace(/\.tsx$/, ''))
const unlisted = templates.filter((n) => !listed.has(n))
const unknown = components.filter((c) => !c.source).map((c) => c.name)
const noExamples = components.filter((c) => !c.examples.length).map((c) => c.name)
if (unlisted.length) console.warn(`  ⚠ Templates missing from gallery.mjs: ${unlisted.join(', ')}`)
if (unknown.length)
  console.warn(`  ⚠ Gallery entries missing from the registry: ${unknown.join(', ')}`)
if (noExamples.length) console.warn(`  ⚠ Entries without example specs: ${noExamples.join(', ')}`)

// Reverse index from tokens to components.
const tokenMap = {}
for (const c of components) {
  for (const t of [...c.colorTokens, ...c.scaleTokens]) (tokenMap[t] ??= []).push(c.name)
}

/* 6. examples/index.tsx: live render map. */
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

/* 7. catalog.ts: server-safe data. */
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
/** value/dark resolve aliases such as var(--ink) to actual values. raw preserves the original declaration. */
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

/** Token utility name → names of components consuming that token. */
export const tokenMap: Record<string, string[]> = ${JSON.stringify(tokenMap, null, 2)}

export const byName: Record<string, Component> = Object.fromEntries(components.map((c) => [c.name, c]))
`
)

/* 8. public/ui/llms.txt: installation and purpose catalog. Detailed usage belongs in the installation guide and copied sources. */
const catalogText = groups
  .map((g) => {
    const lines = components
      .filter((c) => c.group === g.id)
      .map((c) => {
        const from =
          c.importFrom === `@/components/ui/${c.name}` ? '' : ` Import from ${c.importFrom}.`
        const built = c.credits.length
          ? ` Built on ${c.credits.map((cr) => cr.label).join(' and ')}.`
          : ''
        return `- ${c.name}: ${c.summary}${from}${built}`
      })
    return [`### ${g.title}`, g.blurb, ...lines].join('\n')
  })
  .join('\n\n')
const llmsTemplate = readFileSync(join(docsRoot, 'content', 'ui', 'llms-template.txt'), 'utf8')
writeFileSync(
  join(docsRoot, 'public', 'ui', 'llms.txt'),
  llmsTemplate.replace('{{components}}', catalogText)
)

console.log(
  `docs: ${components.length} components in ${groups.length} groups · ${withExamples.length} with live examples · ${tokens.length} tokens`
)
