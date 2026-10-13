import { localizeMetadata } from '@/i18n/metadata'

import { Copy } from '@/i18n/copy'
import { useLocale, useTranslations } from 'next-intl'
import type { Metadata } from 'next'
import { tokens, tokenMap, byName } from '../_generated/catalog'
import { CodeBlock } from '../_components/code-block'

const metadata: Metadata = { title: 'Tokens and theming' }

const ORDER = [
  'Palette',
  'Semantic',
  'Status',
  'Glass',
  'Shape',
  'Type',
  'Motion',
  'Elevation',
  'Layers',
  'Sizes',
]

const EXAMPLE = `@import './comwit-tokens.css';

:root {
  --brand: #0b68ba;        /* buttons, links, focus, selection */
  --brand-strong: #08528f;
  --radius-scale: 0.6;     /* every corner, one dial */
  --pill-radius: 12px;     /* buttons and chips stop being pills */
}`

export default function ThemingPage() {
  const copy = useTranslations('Copy')
  const locale = useLocale()

  const groups = ORDER.filter((g) => tokens.some((t) => t.group === g))
  return (
    <div className="max-w-5xl">
      <header className="max-w-2xl">
        <h1 className="text-display-lg text-foreground">
          <Copy id="text239" />
        </h1>
        <p className="mt-3 text-body text-soft-foreground">
          <Copy id="text240" />{' '}
        </p>
      </header>

      <div className="mt-8 max-w-2xl">
        <CodeBlock code={EXAMPLE} language="css" />
      </div>

      <section className="mt-12">
        <h2 className="text-display-sm text-foreground">
          <Copy id="text241" />
        </h2>
        <iframe
          key={locale}
          src="/preview/ui/theme"
          title={copy('text242')}
          className="theme-editor-frame mt-5"
        />
      </section>

      <section className="mt-16 space-y-12">
        <h2 className="text-display-sm text-foreground">
          <Copy id="text243" />
        </h2>
        {groups.map((g) => (
          <div key={g}>
            <h3 className="text-title-md text-foreground">
              <Copy text={g} />
            </h3>
            <div className="mt-3 divide-y divide-border border-y border-border">
              {tokens
                .filter((t) => t.group === g)
                .map((t) => {
                  const users = [
                    ...new Set([
                      ...(tokenMap[t.name] ?? []),
                      ...tokens
                        .filter((s) => s.layer === 'semantic' && s.raw.includes(`var(--${t.name})`))
                        .flatMap((s) => tokenMap[s.name] ?? []),
                    ]),
                  ]
                  return (
                    <div
                      key={t.name}
                      className="grid gap-2 py-2.5 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:gap-6"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {t.isColor ? (
                          <span className="flex shrink-0 overflow-hidden rounded-md border border-border">
                            <span
                              className="size-5"
                              style={{ background: t.value }}
                              title={copy('text244')}
                            />
                            <span
                              className="size-5"
                              style={{ background: t.dark }}
                              title={copy('text245')}
                            />
                          </span>
                        ) : (
                          <span className="size-5 shrink-0" />
                        )}
                        <code className="truncate font-mono text-caption text-foreground">
                          --{t.name}
                        </code>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <code className="font-mono text-caption text-muted-foreground">
                          {t.raw.length > 48 ? `${t.raw.slice(0, 48)}…` : t.raw}
                        </code>
                        {users.slice(0, 8).map((n) => (
                          <a
                            key={n}
                            href={`/ui/components#${n}`}
                            className="text-caption text-soft-foreground underline-offset-2 hover:text-primary hover:underline"
                          >
                            <Copy text={byName[n]?.title ?? n} />
                          </a>
                        ))}
                        {users.length > 8 && (
                          <span className="text-caption text-muted-foreground">
                            +{users.length - 8} <Copy id="text246" />{' '}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export async function generateMetadata() {
  return localizeMetadata(metadata)
}
