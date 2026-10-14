import { Copy } from '@/i18n/copy'
import Link from 'next/link'
import { ArrowUpRightIcon } from '@comwit/ui/icons'
import { Button } from '@comwit/ui-templates/button'
import { CliCommand } from './_components/cli-command'
import { AppShellExhibit } from './_components/exhibits'
import { components, groups, type Component } from './_generated/catalog'

/** Group libraries by the components built on them, using catalog dependency credits. */
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
            <Copy id="text130" />{' '}
          </p>
          <div className="mt-8 space-y-2">
            <CliCommand command="npx comwit-ui@latest init" />
            <CliCommand command="npx comwit-ui@latest add app-bar bottom-nav bottom-sheet page-transition" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="lg" asChild>
              <Link href="/ui/components">
                <Copy id="text131" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/ui/docs/installation">
                <Copy id="text132" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/ui/icons">
                <Copy id="text133" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <AppShellExhibit />
        </div>
      </section>

      <section aria-labelledby="inside" className="mt-24">
        <h2 id="inside" className="text-display-sm text-foreground">
          <Copy id="text134" />{' '}
        </h2>
        <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id} className="border-t border-border">
              <Link
                href={`/ui/components#${g.id}`}
                className="group block rounded-control py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block text-title-md text-foreground transition-colors duration-fast group-hover:text-primary">
                  <Copy text={g.title} />
                </span>
                <span className="mt-1 block text-body-sm text-soft-foreground">
                  <Copy text={g.blurb} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="curated" className="mt-24">
        <h2 id="curated" className="text-display-sm text-foreground">
          <Copy id="text135" />{' '}
        </h2>
        <p className="mt-2 max-w-2xl text-body text-soft-foreground">
          <Copy id="text136" />{' '}
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
                  <Copy text={label} />
                  <ArrowUpRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                </a>
                <span className="mt-1 block text-body-sm text-soft-foreground">
                  {items.map((c, i) => (
                    <span key={c.name}>
                      {i > 0 && ' · '}
                      <Link
                        href={`/ui/components#${c.name}`}
                        className="rounded-sm underline decoration-border underline-offset-[3px] transition-colors duration-fast hover:text-primary hover:decoration-primary"
                      >
                        <Copy text={c.title} />
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
