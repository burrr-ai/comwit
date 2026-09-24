import Link from 'next/link'
import { Button } from '@comwit/ui-templates/button'
import { CliCommand } from './_components/cli-command'
import { AppShellExhibit } from './_components/exhibits'
import { groups } from './_generated/catalog'

export default function UiOverview() {
  return (
    <div>
      <section className="grid items-center gap-x-16 gap-y-12 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-xl">
          <h1 className="text-display-xl text-foreground sm:text-[56px]">Comwit UI</h1>
          <p className="mt-4 text-title-lg font-normal text-soft-foreground">
            React components for apps that live on phones. Install the source and own every line.
          </p>
          <div className="mt-8 space-y-2">
            <CliCommand command="npx comwit-ui@latest init" />
            <CliCommand command="npx comwit-ui@latest add app-bar bottom-nav" />
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
                className="group flex items-start justify-between gap-6 rounded-control py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>
                  <span className="block text-title-md text-foreground transition-colors duration-fast group-hover:text-primary">
                    {g.title}
                  </span>
                  <span className="mt-1 block text-body-sm text-soft-foreground">{g.blurb}</span>
                </span>
                <span className="pt-0.5 text-label tabular-nums text-muted-foreground">
                  {g.items.length}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
