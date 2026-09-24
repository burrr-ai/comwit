import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { byName, components } from '../../_generated/catalog'
import { CliCommand } from '../../_components/cli-command'
import { CodeBlock } from '../../_components/code-block'
import { ExampleGallery } from '../../_components/example-gallery'

export function generateStaticParams() {
  return components.map((c) => ({ name: c.name }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const c = byName[name]
  return c ? { title: c.title, description: c.oneLiner } : {}
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const c = byName[name]
  if (!c) notFound()

  const importLine = `import { ${c.compoundParts.join(', ')} } from "${c.importFrom}"`
  const isSingle = c.compoundParts.length <= 1
  const usedTokens = [...c.colorTokens, ...c.scaleTokens]

  return (
    <article className="max-w-3xl">
      <nav className="text-caption text-muted-foreground">
        <Link href="/ui/components" className="hover:text-foreground">
          컴포넌트
        </Link>{' '}
        / {c.title}
      </nav>

      <header className="mt-3">
        <h1 className="text-display-md text-foreground">{c.title}</h1>
        <p className="mt-1 text-body text-muted-foreground">{c.oneLiner}</p>
      </header>

      <section className="mt-10">
        <h2 className="mb-4 text-title-sm text-foreground">예시</h2>
        <ExampleGallery name={c.name} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-title-sm text-foreground">설치</h2>
        <CliCommand command={c.cli} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-title-sm text-foreground">
          구성{isSingle ? ' · 단일 컴포넌트' : ` · ${c.compoundParts.length} 파트`}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {c.compoundParts.map((p) => (
            <code
              key={p}
              className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-[12px] text-foreground"
            >
              {p}
            </code>
          ))}
        </div>
        <div className="mt-3">
          <CodeBlock code={importLine} />
        </div>
      </section>

      {usedTokens.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-title-sm text-foreground">쓰는 토큰</h2>
          <p className="mb-3 text-body-sm text-muted-foreground">
            이 토큰을 바꾸면 이 컴포넌트에 반영됩니다.{' '}
            <Link href="/ui/theming" className="underline underline-offset-4 hover:text-foreground">
              토큰 편집 →
            </Link>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {usedTokens.map((t) => (
              <Link
                key={t}
                href="/ui/theming"
                className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-accent"
              >
                {t}
              </Link>
            ))}
          </div>
        </section>
      )}

      {c.source && (
        <section className="mt-10">
          <details className="group">
            <summary className="cursor-pointer text-title-sm text-foreground marker:text-muted-foreground">
              소스 (복사해서 소유)
            </summary>
            <p className="mt-2 mb-3 text-body-sm text-muted-foreground">
              <code className="font-mono text-foreground">{c.cli}</code> 로 설치하거나 아래를
              복사하세요.
              {c.npmDeps.length > 0 && <> npm: {c.npmDeps.join(', ')}</>}
            </p>
            <CodeBlock code={c.source} />
          </details>
        </section>
      )}
    </article>
  )
}
