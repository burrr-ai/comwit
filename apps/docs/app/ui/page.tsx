import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@comwit/ui-templates/button'
import { CliCommand } from './_components/cli-command'
import { AppShellExhibit } from './_components/exhibits'
import { components, groups, type Component } from './_generated/catalog'

/** 큐레이션 — 라이브러리 → 그 위에 만든 컴포넌트. 카탈로그의 크레딧(npm deps)에서 자동으로 모은다. */
function curatedLibraries() {
  const byLibrary = new Map<string, { href: string; items: Component[] }>()
  for (const c of components)
    for (const credit of c.credits) {
      const entry = byLibrary.get(credit.label) ?? { href: credit.href, items: [] }
      entry.items.push(c)
      byLibrary.set(credit.label, entry)
    }
  return [...byLibrary].sort((a, b) => b[1].items.length - a[1].items.length)
}

export default function UiOverview() {
  const curated = curatedLibraries()
  return (
    <div>
      <section className="grid grid-cols-1 items-center gap-x-16 gap-y-12 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-xl">
          <h1 className="text-display-xl text-foreground sm:text-[56px]">Comwit UI</h1>
          <p className="mt-4 text-title-lg font-normal text-soft-foreground">
            A curated kit for building app UI. The best library for each job, wrapped under one
            design system and installed as source you own.
          </p>
          <div className="mt-8 space-y-2">
            <CliCommand command="npx comwit-ui@latest init" />
            <CliCommand command="npx comwit-ui@latest add app-bar bottom-nav bottom-sheet page-transition" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="lg" asChild>
              <Link href="/ui/components">Browse components</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/ui/docs/installation">Installation</Link>
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <AppShellExhibit />
        </div>
      </section>

      <section aria-labelledby="inside" className="mt-24">
        <h2 id="inside" className="text-display-sm text-foreground">
          In the gallery
        </h2>
        <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id} className="border-t border-border">
              <Link
                href={`/ui/components#${g.id}`}
                className="group block rounded-control py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block text-title-md text-foreground transition-colors duration-fast group-hover:text-primary">
                  {g.title}
                </span>
                <span className="mt-1 block text-body-sm text-soft-foreground">{g.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="curated" className="mt-24">
        <h2 id="curated" className="text-display-sm text-foreground">
          One library per job
        </h2>
        <p className="mt-2 max-w-2xl text-body text-soft-foreground">
          Where a proven library already does the job best, the template wraps it under a neutral
          name and the CLI installs the wrapper as source. Behavior and accessibility stay in the
          headless engine; the look comes from one set of tokens.
        </p>
        <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
          {curated.map(([label, { href, items }]) => (
            <li
              key={label}
              className="flex items-start justify-between gap-6 border-t border-border py-5"
            >
              <span className="min-w-0">
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-control text-title-md text-foreground outline-none transition-colors duration-fast hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {label}
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </a>
                <span className="mt-1 block text-body-sm text-soft-foreground">
                  {items.map((c, i) => (
                    <span key={c.name}>
                      {i > 0 && ' · '}
                      <Link
                        href={`/ui/components#${c.name}`}
                        className="rounded-sm underline decoration-border underline-offset-[3px] transition-colors duration-fast hover:text-primary hover:decoration-primary"
                      >
                        {c.title}
                      </Link>
                    </span>
                  ))}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
