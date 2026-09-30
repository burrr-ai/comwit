import Link from 'next/link'
import { CopyCommand } from './_components/copy-command'
import { SliceDiagram } from './_components/slice-diagram'

const TRAPS = [
  {
    trap: 'Over-abstracting similar UI',
    rule: 'Domain UI is repeated, not shared.',
    detail: 'UI is repeated; logic is reused.',
  },
  {
    trap: 'Over-separating concerns',
    rule: 'The api layer preprocesses.',
    detail: 'Components never format, filter or aggregate.',
  },
  {
    trap: 'Over-splitting cohesive operations',
    rule: 'Actions own every side effect.',
    detail: 'List and detail change together.',
  },
]

// 쓰는 순서(아래→위)대로. 다이어그램의 띠와 같은 이름을 쓴다.
const LAYERS = [
  {
    layer: 'repository',
    path: 'src/server/repository',
    job: 'The only door to data. Mock rows first, a database when needed.',
  },
  {
    layer: 'api',
    path: 'src/services/{service}/api/{domain}',
    job: 'Server actions shaped for the screen. Labels and dates are computed here.',
  },
  {
    layer: 'state',
    path: 'src/services/{service}/state/{domain}',
    job: 'One typed hook per domain. Queries, local fields, every side effect.',
  },
  {
    layer: 'page',
    path: 'src/services/{service}/page/{route}',
    job: 'Sections that read one hook and render. No data processing.',
  },
]

// 트리 한 줄: 들여쓰기 깊이, 이름, 가이드면 언제 읽는지.
const GUIDE_TREE: { depth: number; name: string; note?: string }[] = [
  { depth: 0, name: 'src/' },
  { depth: 1, name: 'app/' },
  { depth: 2, name: '.ai.md', note: 'routes, layouts, the auth boundary' },
  { depth: 1, name: 'services/' },
  { depth: 2, name: '.ai.md', note: 'import rules, layer dependencies' },
  { depth: 2, name: 'api.ai.md', note: 'writing server actions' },
  { depth: 2, name: 'state.ai.md', note: 'models, actions, hooks' },
  { depth: 2, name: 'page.ai.md', note: 'screens and installed components' },
  { depth: 2, name: 'design.md', note: 'voice, mood, type scale, tokens' },
  { depth: 2, name: 'admin/' },
  { depth: 3, name: '.ai.md', note: 'admin routes and accounts' },
  { depth: 1, name: 'server/repository/' },
  { depth: 2, name: '.ai.md', note: 'mock data, CRUD names, migration' },
]

const SKILLS = ['app-setup', 'auth-setup', 'seo-optimize', 'refactoring']

const CHOSEN = [
  {
    name: 'Next.js 16 App Router',
    note: 'Cache Components, service worker, offline page',
  },
  { name: '@comwit/state', note: 'one typed hook per domain', code: true },
  { name: 'comwit-ui', note: 'installed as source, Tailwind v4 tokens', code: true },
  { name: 'Better Auth + Drizzle', note: 'added per service when the data is real' },
  { name: 'Oxlint', note: 'project rules for every layer boundary' },
]

const LEFT_TO_YOU = [
  'The database',
  'The storage bucket',
  'The hosting platform',
  'The brand tokens',
  'The UI language (Korean by default, in one file)',
]

export default function TemplateOverview() {
  return (
    <div className="tp-overview">
      <header className="tp-hero">
        <p className="tp-kicker">
          Next.js template, installed with <code>create-comwit</code>
        </p>
        <h1>
          <span>Change arrives per domain.</span> <span>So does the code.</span>
        </h1>
        <p className="tp-lead">
          A Next.js 16 template where screens are sliced by service and domain, four layers depend
          one way, and an <code>.ai.md</code> rulebook sits beside every layer. One command. No
          infrastructure decided for you.
        </p>
        <div className="tp-hero-actions">
          <CopyCommand command="npm create comwit@latest my-app" />
          <div className="tp-hero-links">
            <Link href="/template/docs/getting-started" className="tp-button">
              Getting started
            </Link>
            <Link href="/template/docs/architecture" className="tp-link">
              Why domains, not layers
            </Link>
          </div>
        </div>
      </header>

      <section className="tp-section tp-slices" aria-labelledby="tp-slices-title">
        <h2 id="tp-slices-title" className="tp-section-title">
          One slice per domain. Four layers inside it.
        </h2>
        <figure className="tp-figure">
          <SliceDiagram />
          <figcaption className="tp-titleblock">
            <p className="tp-titleblock-main">
              <code>page → state → api → repository</code>. Never backwards, never around.
            </p>
            <p>
              Services slice by who the user is; domains slice by what the business talks about.
            </p>
          </figcaption>
        </figure>
      </section>

      <section className="tp-section" aria-labelledby="tp-traps-title">
        <h2 id="tp-traps-title" className="tp-section-title">
          Three traps, three rules
        </h2>
        <p className="tp-section-lead">
          Every growing React project falls into the same three. Each rule in the template is the
          fix for one of them.
        </p>
        <dl className="tp-traps">
          {TRAPS.map((item) => (
            <div key={item.trap} className="tp-trap">
              <dt>
                <span className="tp-trap-tag">Trap</span>
                {item.trap}
              </dt>
              <dd>
                <span className="tp-trap-tag">Rule</span>
                <strong>{item.rule}</strong> {item.detail}
              </dd>
            </div>
          ))}
        </dl>
        <Link href="/template/docs/architecture#three-traps" className="tp-link">
          Read the three traps in full
        </Link>
      </section>

      <section className="tp-section" aria-labelledby="tp-layers-title">
        <h2 id="tp-layers-title" className="tp-section-title">
          Every layer has one job
        </h2>
        <p className="tp-section-lead">Written bottom-up, read top-down.</p>
        <ol className="tp-layers">
          {LAYERS.map((item) => (
            <li key={item.layer} data-layer={item.layer}>
              <code className="tp-layers-path">{item.path}</code>
              <p>{item.job}</p>
            </li>
          ))}
        </ol>
        <Link href="/template/docs/layers" className="tp-link">
          The four layers, with code
        </Link>
      </section>

      <section className="tp-section tp-docs" aria-labelledby="tp-docs-title">
        <h2 id="tp-docs-title" className="tp-section-title">
          The structure is the documentation
        </h2>
        <div>
          <p className="tp-section-lead">
            Instead of a long README, a short guide sits beside each layer and states the few things
            a folder tree cannot: write order, naming, which side effects belong where. Coding
            agents read the same files you do.
          </p>
          <p className="tp-section-lead">
            Two dozen Oxlint rules fail <code>pnpm run validate</code> when a boundary is crossed.
          </p>
          <Link href="/template/docs/structure#what-enforces-it" className="tp-link">
            What enforces it
          </Link>
        </div>
        <ul className="tp-tree" aria-label="The .ai.md guides in a new project">
          {GUIDE_TREE.map((row, index) => (
            <li
              key={index}
              data-depth={row.depth}
              style={{ '--depth': row.depth } as React.CSSProperties}
              data-guide={row.note ? true : undefined}
            >
              <code>{row.name}</code>
              {row.note && <span>{row.note}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="tp-section" aria-labelledby="tp-flow-title">
        <h2 id="tp-flow-title" className="tp-section-title">
          Screen first, data later
        </h2>
        <ol className="tp-steps">
          <li>
            <p>
              Mock rows in <code>_data/</code>, screens on top.
            </p>
          </li>
          <li>
            <p>
              Connect a Drizzle database when persistence is real. Repositories change inside; the
              api layer doesn’t move.
            </p>
          </li>
          <li>
            <p>
              <code>auth-setup</code> installs Better Auth per service.
            </p>
          </li>
        </ol>
        <p className="tp-skills">
          <span>Skills in every project</span>
          {SKILLS.map((skill) => (
            <Link key={skill} href="/template/docs/agents#skills">
              <code>{skill}</code>
            </Link>
          ))}
        </p>
      </section>

      <section className="tp-section" aria-labelledby="tp-curated-title">
        <h2 id="tp-curated-title" className="tp-section-title">
          Curated, not decided
        </h2>
        <div className="tp-curated">
          <div>
            <h3>Chosen for you</h3>
            <ul className="tp-chosen">
              {CHOSEN.map((item) => (
                <li key={item.name}>
                  {item.code ? <code>{item.name}</code> : <strong>{item.name}</strong>}
                  <span>{item.note}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Left to you</h3>
            <ul className="tp-open">
              {LEFT_TO_YOU.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="tp-footer">
        <Link href="/state/docs">State docs</Link>
        <Link href="/ui">UI docs</Link>
        <a href="https://github.com/burrr-ai/comwit" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="/template/llms.txt">llms.txt</a>
      </footer>
    </div>
  )
}
