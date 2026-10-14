import { getLocale } from 'next-intl/server'

import { Copy } from '@/i18n/copy'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getTemplateDocs } from '@/lib/template-docs'
import { CopyCommand } from './_components/copy-command'
import { SliceDiagram } from './_components/slice-diagram'

// Show strengths at a glance here; structure, principles, and rationale belong in How it works.
const STRENGTHS = [
  { title: 'Build like a developer, without being one.', body: 'strengthAgents' },
  { title: 'Full-stack in one repo.', body: 'strengthStack' },
  { title: 'Maintainable for a hundred years.', body: 'text064' },
  { title: 'Rules that enforce themselves.', body: 'strengthRules' },
] as const

const CHOSEN: { name: string; note?: string; code?: boolean }[] = [
  { name: 'Next.js 16 App Router', note: 'Cache Components, service worker, offline page' },
  { name: '@comwit/state', code: true },
  { name: 'comwit-ui', note: 'installed as source, Tailwind v4 tokens', code: true },
  { name: 'Better Auth + Drizzle' },
  { name: 'Oxlint' },
  { name: 'Storybook', note: 'page-level stories, api mocked at the boundary' },
]

const YOURS: React.ReactNode[] = [
  'The database',
  'The bucket',
  <>
    <Copy id="text068" /> <code>--opennext</code> <Copy id="text070" />{' '}
  </>,
  'The brand tokens',
  'The UI language (Korean by default, one file)',
]

export default async function TemplateOverview() {
  const copy = await getTranslations('Copy')

  const guides = getTemplateDocs(await getLocale()).filter((doc) => doc.group === 'How it works')

  return (
    <div className="tp-overview">
      <header className="tp-hero">
        <p className="tp-kicker">
          <code>create-comwit</code> <Copy id="text072" />{' '}
        </p>
        <h1>
          <span>
            <Copy id="text073" />
          </span>{' '}
          <span>
            <Copy id="text074" />
          </span>
        </h1>
        <p className="tp-lead">
          <Copy id="text075" />{' '}
        </p>
        <div className="tp-hero-actions">
          <CopyCommand command="npm create comwit@latest my-app" />
          <div className="tp-hero-links">
            <Link href="/template/docs/getting-started" className="tp-button">
              <Copy id="text076" />{' '}
            </Link>
            <Link href="/template/docs/architecture" className="tp-link">
              <Copy id="text077" />{' '}
            </Link>
          </div>
        </div>
      </header>

      <ul className="tp-strengths" aria-label={copy('text078')}>
        {STRENGTHS.map((item) => (
          <li key={item.title}>
            <h2>
              <Copy text={item.title} />
            </h2>
            <p>{copy.rich(item.body, { code: (chunks) => <code>{chunks}</code> })}</p>
          </li>
        ))}
      </ul>

      <section className="tp-section" aria-labelledby="tp-slices-title">
        <h2 id="tp-slices-title" className="tp-section-title">
          <Copy id="text079" />{' '}
        </h2>
        <figure className="tp-figure">
          <SliceDiagram />
          <figcaption className="tp-caption">
            <code>page → state → api → repository</code>
            <Copy id="text081" />{' '}
          </figcaption>
        </figure>
      </section>

      <section className="tp-section" aria-labelledby="tp-kit-title">
        <h2 id="tp-kit-title" className="tp-section-title">
          <Copy id="text082" />{' '}
        </h2>
        <div className="tp-kit">
          <div>
            <h3>
              <Copy id="text083" />
            </h3>
            <ul className="tp-chosen">
              {CHOSEN.map((item) => (
                <li key={item.name}>
                  {item.code ? (
                    <code>
                      <Copy text={item.name} />
                    </code>
                  ) : (
                    <strong>
                      <Copy text={item.name} />
                    </strong>
                  )}
                  {item.note && (
                    <span>
                      <Copy text={item.note} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>
              <Copy id="text084" />
            </h3>
            <ul className="tp-open">
              {YOURS.map((item, index) => (
                <li key={index}>{typeof item === 'string' ? <Copy text={item} /> : item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="tp-section" aria-labelledby="tp-read-title">
        <h2 id="tp-read-title" className="tp-section-title">
          <Copy id="text085" />{' '}
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
        <Link href="/state/docs">
          <Copy id="text086" />
        </Link>
        <Link href="/ui">
          <Copy id="text087" />
        </Link>
        <a href="https://github.com/burrr-ai/comwit" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="/template/llms.txt">llms.txt</a>
      </footer>
    </div>
  )
}
