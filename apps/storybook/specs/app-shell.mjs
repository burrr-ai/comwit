export const specs = [
  {
    title: 'AppShell',
    slug: 'app-shell',
    covers: ['app-shell', 'tab-bar', 'app-screen'],
    imports: [
      { from: '@comwit/ui-templates/app-shell', names: ['AppShell', 'TabShell'] },
      { from: '@comwit/ui-templates/app-screen', names: ['AppScreen', 'DetailScreen'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { ChevronRight, Compass, House, User } from 'lucide-react'`,
      `const TABS = [
  { href: '/', label: 'Home', icon: House },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/me', label: 'Profile', icon: User },
]
const NOTES = [
  { id: 1, title: 'Packing list', body: 'Passport, chargers, the good camera and one book too many.' },
  { id: 2, title: 'Places to eat', body: 'Black pork near the harbor. The noodle stand opens at eleven.' },
  { id: 3, title: 'Day three', body: 'Sunrise peak at six, then the coast road with the windows down.' },
]`,
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description:
          'The whole mobile shell from one component: the only scroller, pull to refresh, the scroll intent the app bar and tab bar share, page transitions and history-aware back. Tabs slide sideways under a bar that stays put; a detail drills in and takes the bar with it. Installed for your router (Next.js, React Router, TanStack Router) — this demo is the generic one driven by state.',
        renderFn: `const [path, setPath] = React.useState('/')
const isTab = TABS.some((t) => t.href === path)
const note = NOTES.find((n) => '/notes/' + n.id === path)
const [updated, setUpdated] = React.useState(() => new Date())
const refresh = () => new Promise<void>((done) => setTimeout(() => { setUpdated(new Date()); done() }, 900))
return (
  <div className="h-[560px] w-full max-w-sm overflow-hidden rounded-card bg-muted">
    <AppShell tabs={TABS} path={path} onNavigate={setPath} onRefresh={refresh} className="h-full">
      {isTab ? (
        <TabShell>
          <AppScreen title={TABS.find((t) => t.href === path)?.label}>
            <p className="px-5 pb-2 text-caption text-muted-foreground">
              Updated {updated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </p>
            {path === '/' ? (
              <ul className="px-3 pb-3">
                {NOTES.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setPath('/notes/' + n.id)}
                      className="flex w-full items-center justify-between rounded-control px-3 py-3 text-left text-label font-medium text-foreground hover:bg-accent"
                    >
                      {n.title}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3 px-4 pb-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="h-16 rounded-control bg-muted" />
                ))}
              </div>
            )}
          </AppScreen>
        </TabShell>
      ) : (
        <DetailScreen fallback="/" title={note?.title}>
          <p className="px-5 pt-2 pb-6 text-body text-soft-foreground">{note?.body}</p>
          <div className="px-5">
            <Button variant="outline" onClick={() => setPath('/')}>Done</Button>
          </div>
        </DetailScreen>
      )}
    </AppShell>
  </div>
)`,
      },
    ],
  },
]
