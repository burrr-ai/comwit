// ─────────────────────────────────────────────────────────────────────────
// comwit 레지스트리 생성기 (자체 포맷 · shadcn 스키마 아님).
// @comwit/ui-templates 소스를 읽어 packages/ui/cli/registry/ 로 뽑는다:
//   index.json      — 아이템 메타(이름/타입/deps) 목록
//   <name>.json     — 아이템 전체(파일 content 포함)
// comwit-ui 가 이걸 번들로 싣고 `comwit-ui add <name>` 시 소비한다. shadcn CLI/스키마/components.json 안 씀.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url)) // packages/ui/cli/scripts
const tplSrc = join(here, '..', '..', 'templates', 'src') // packages/ui/templates/src
const outDir = join(here, '..', 'registry') // packages/ui/cli/registry

const IGNORE_NPM = new Set(['react', 'react-dom'])

function pkgName(spec) {
  if (spec.startsWith('@')) return spec.split('/').slice(0, 2).join('/')
  return spec.split('/')[0]
}
function parseImports(content) {
  const specs = []
  const re = /from\s+["']([^"']+)["']/g
  let m
  while ((m = re.exec(content))) specs.push(m[1])
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
      registryDeps.add(s.slice(2)) // 형제 ui 컴포넌트
    else if (s.startsWith('../../lib/popup')) registryDeps.add('popup')
    else if (s.startsWith('../../lib/utils')) registryDeps.add('utils')
    else if (s.startsWith('../../lib/interaction')) registryDeps.add('interaction')
    else if (s.startsWith('../../hooks')) registryDeps.add('use-mobile')
    else if (s.startsWith('.')) continue
    else {
      const p = pkgName(s)
      if (!IGNORE_NPM.has(p)) deps.add(p)
    }
  }
  items.push({
    name,
    type: 'ui',
    dependencies: [...deps].sort(),
    registryDependencies: [...registryDeps].sort(),
    files: [{ path: `components/ui/${file}`, content }],
  })
}

// 2) lib / hooks 지원 파일
function fileItem(name, relPath, type) {
  const content = readFileSync(join(tplSrc, relPath), 'utf8')
  const deps = new Set()
  const registryDeps = new Set()
  for (const s of parseImports(content)) {
    if (s.startsWith('../components/ui/')) registryDeps.add(s.split('/').pop())
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
items.push(fileItem('utils', 'lib/utils.ts', 'lib'))
items.push(fileItem('popup', 'lib/popup.tsx', 'lib'))
items.push(fileItem('interaction', 'lib/interaction.ts', 'lib'))
items.push(fileItem('use-mobile', 'hooks/use-mobile.ts', 'hook'))

// 3) theme — 토큰 계약. globals.css(SSOT) 에서 :root 이후(토큰 + @theme + base)를 그대로 CSS 파일로 싣는다.
//    `comwit-ui init` 이 이 파일을 프로젝트에 쓰고 globals.css 에서 @import 하도록 배선한다.
function buildThemeItem() {
  const css = readFileSync(join(tplSrc, 'styles', 'globals.css'), 'utf8')
  // @custom-variant dark 는 :root 보다 앞에 있고, 이게 없으면 소비자 쪽 `dark:` 변형이 죽는다.
  // 따라서 자르는 기준은 :root 가 아니라 "tailwind 임포트 이후 첫 저작 규칙"이어야 한다.
  const startIdx = [css.indexOf('@custom-variant'), css.indexOf(':root')]
    .filter((i) => i !== -1)
    .sort((a, b) => a - b)[0]
  const tokens =
    startIdx === undefined
      ? css
      : `/* comwit-ui 디자인 토큰 (SSOT: @comwit/ui-templates/styles.css). 값만 바꿔 리테마. */\n` +
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

// 4) 출력: index + per-item
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
for (const it of items) {
  writeFileSync(join(outDir, `${it.name}.json`), JSON.stringify(it, null, 2))
}
const index = {
  name: 'comwit',
  homepage: 'https://github.com/meursyphus/comwit-ui',
  items: items.map(({ files, ...meta }) => meta),
}
writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2))
console.log(
  `comwit registry: ${items.length} items → packages/ui/cli/registry/*.json (ui ${
    items.filter((i) => i.type === 'ui').length
  } · lib ${items.filter((i) => i.type === 'lib').length} · hook ${
    items.filter((i) => i.type === 'hook').length
  } · theme ${items.filter((i) => i.type === 'theme').length})`
)
