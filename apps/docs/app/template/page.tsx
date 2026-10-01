import Link from 'next/link'
import { getTemplateDocs } from '@/lib/template-docs'
import { CopyCommand } from './_components/copy-command'
import { SliceDiagram } from './_components/slice-diagram'

// 개요는 설명하지 않는다 — 강점만 한눈에. 구조·원리·이유는 "How it works" 문서가 맡는다.
const STRENGTHS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Build like a developer, without being one.',
    body: (
      <>
        <code>AGENTS.md</code>, an <code>.ai.md</code> beside every layer and one-time skills (
        <code>app-setup</code>, <code>auth-setup</code>, <code>seo-optimize</code>) tell Claude
        Code, Codex or Antigravity where things go and how they are written. Your prompts stay about
        the product.
      </>
    ),
  },
  {
    title: 'Full-stack in one repo.',
    body: (
      <>
        The api layer is the backend: typed server functions over the kit’s own transport — parallel
        calls, only <code>ActionError</code> reaches the browser, Server Components call them with
        no HTTP hop. No second service to run.
      </>
    ),
  },
  {
    title: 'Maintainable for a hundred years.',
    body: (
      <>
        Screens sliced by service and domain, four layers that depend one way. A change to posts
        touches the post slice and nothing else.
      </>
    ),
  },
  {
    title: 'Rules that enforce themselves.',
    body: (
      <>
        Two dozen Oxlint rules fail <code>pnpm run validate</code> when a boundary is crossed,
        before anyone reviews.
      </>
    ),
  },
]

const CHOSEN: { name: string; note?: string; code?: boolean }[] = [
  { name: 'Next.js 16 App Router', note: 'Cache Components, service worker, offline page' },
  { name: '@comwit/state', code: true },
  { name: 'comwit-ui', note: 'installed as source, Tailwind v4 tokens', code: true },
  { name: 'Better Auth + Drizzle' },
  { name: 'Oxlint' },
]

const YOURS: React.ReactNode[] = [
  'The database',
  'The bucket',
  <>
    The hosting (or <code>--opennext</code> for Cloudflare Workers)
  </>,
  'The brand tokens',
  'The UI language (Korean by default, one file)',
]

export default function TemplateOverview() {
  const guides = getTemplateDocs().filter((doc) => doc.group === 'How it works')

  return (
    <div className="tp-overview">
      <header className="tp-hero">
        <p className="tp-kicker">
          <code>create-comwit</code> AI-native · Next.js full-stack
        </p>
        <h1>
          <span>One command.</span> <span>A codebase your agent can’t get wrong.</span>
        </h1>
        <p className="tp-lead">
          Next.js as the whole stack, with the architecture, the agent rulebook and the lint rules
          that enforce it in one project — so a non-developer with a coding agent builds like a
          senior team, and the code stays maintainable for a hundred years.
        </p>
        <div className="tp-hero-actions">
          <CopyCommand command="npm create comwit@latest my-app" />
          <div className="tp-hero-links">
            <Link href="/template/docs/getting-started" className="tp-button">
              Install
            </Link>
            <Link href="/template/docs/architecture" className="tp-link">
              How it works
            </Link>
          </div>
        </div>
      </header>

      <ul className="tp-strengths" aria-label="What the kit gives you">
        {STRENGTHS.map((item) => (
          <li key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>

      <section className="tp-section" aria-labelledby="tp-slices-title">
        <h2 id="tp-slices-title" className="tp-section-title">
          One slice per domain. Four layers inside it.
        </h2>
        <figure className="tp-figure">
          <SliceDiagram />
          <figcaption className="tp-caption">
            <code>page → state → api → repository</code>. Never backwards, never around.
          </figcaption>
        </figure>
      </section>

      <section className="tp-section" aria-labelledby="tp-kit-title">
        <h2 id="tp-kit-title" className="tp-section-title">
          Inside the kit
        </h2>
        <div className="tp-kit">
          <div>
            <h3>Chosen</h3>
            <ul className="tp-chosen">
              {CHOSEN.map((item) => (
                <li key={item.name}>
                  {item.code ? <code>{item.name}</code> : <strong>{item.name}</strong>}
                  {item.note && <span>{item.note}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Yours</h3>
            <ul className="tp-open">
              {YOURS.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="tp-section" aria-labelledby="tp-read-title">
        <h2 id="tp-read-title" className="tp-section-title">
          Read on
        </h2>
        <ul className="tp-read">
          {guides.map((doc) => (
            <li key={doc.slug}>
              <Link href={`/template/docs/${doc.slug}`}>
                <strong>{doc.title}</strong>
                {doc.description && <span>{doc.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
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
