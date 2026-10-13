'use client'

/**
 * Placeholder home. Replace this folder when the project has a real home screen.
 * Its purpose is to show which code belongs in each layer.
 */

const LAYERS: { name: string; path: string; role: string }[] = [
  {
    name: 'repository',
    path: 'src/server/repository',
    role: 'The single data gateway. Start with mocks and connect a database when needed.',
  },
  {
    name: 'api',
    path: 'src/services/app/api/{domain}',
    role: 'Server actions shaped for each screen, including display-ready transformations.',
  },
  {
    name: 'state',
    path: 'src/services/app/state/{domain}',
    role: 'Domain state and actions. Keep every side effect inside actions.',
  },
  {
    name: 'page',
    path: 'src/services/app/page/{route}',
    role: 'Screens composed from sections. Read state and call actions without processing data.',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-10 px-6 py-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-display-md text-balance text-foreground">
          Build screens first. Connect data when you need it.
        </h1>
        <p className="text-body text-soft-foreground">
          Each folder’s <code className="font-mono">.ai.md</code> explains its layer. Read it
          alongside <code className="font-mono">AGENTS.md</code> before writing code.
        </p>
      </header>

      <dl className="flex flex-col">
        {LAYERS.map((layer) => (
          <div
            key={layer.name}
            className="flex flex-col gap-1 border-t border-border py-5 sm:flex-row sm:gap-6"
          >
            <dt className="text-title-sm text-foreground sm:w-28 sm:shrink-0">{layer.name}</dt>
            <dd className="flex flex-col gap-1">
              <p className="font-mono text-body-sm text-foreground">{layer.path}</p>
              <p className="text-body-sm text-soft-foreground">{layer.role}</p>
            </dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
