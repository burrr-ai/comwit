export const specs = [
  {
    title: 'PageTransition',
    slug: 'page-transition',
    covers: ['page-transition'],
    // A state value stands in for the router here. In an app, RouteBoundary reads the pathname
    // from your router and you never call PageBoundary yourself.
    imports: [
      {
        from: '@comwit/ui-templates/page-transition',
        names: ['PageTransition', 'PageBoundary', 'drill', 'sheet', 'slide'],
      },
      {
        from: '@comwit/ui-templates/app-bar',
        names: ['AppBar', 'AppBarActions', 'AppBarBackButton', 'AppBarTitle'],
      },
      { from: '@comwit/ui-templates/bottom-nav', names: ['BottomNav', 'BottomNavItem'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
      { from: '@comwit/ui-templates/textarea', names: ['Textarea'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { ChevronRight, Compass, House, PenLine, User } from 'lucide-react'`,
      `const NOTES = [
  { id: 1, title: 'Packing list', body: 'Passport, chargers, the good camera and one book too many.' },
  { id: 2, title: 'Places to eat', body: 'Black pork near the harbor. The noodle stand opens at eleven.' },
  { id: 3, title: 'Day three', body: 'Sunrise peak at six, then the coast road with the windows down.' },
]`,
      `const transitions = {
  transitions: [
    // list → detail drills in; Back drills out. Scroll position of the list is restored.
    { on: '/notes/**', except: '/notes', transition: drill() },
    // a temporary task rises over the page and blurs it
    { on: '/compose', transition: sheet({ type: 'blur' }) },
    // tabs slide by their order; the bar below stays put
    { ordered: ['/home', '/explore', '/me'], transition: slide() },
  ],
}`,
    ],
    stories: [
      {
        name: 'Drill',
        gallery: true,
        description:
          'on + except: entering /notes/* drills in, leaving drills out. Pages need a background so the one underneath does not show through.',
        renderFn: `const [path, setPath] = React.useState('/notes')
const note = NOTES.find((n) => '/notes/' + n.id === path)
return (
  <div className="h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="min-h-full">
      {note ? (
        <PageBoundary path={path} className="min-h-full bg-background">
          <AppBar behavior="pinned">
            <AppBarBackButton onClick={() => setPath('/notes')} />
            <AppBarTitle>{note.title}</AppBarTitle>
          </AppBar>
          <p className="px-5 pt-2 pb-6 text-body text-soft-foreground">{note.body}</p>
        </PageBoundary>
      ) : (
        <PageBoundary path="/notes" className="min-h-full bg-background">
          <AppBar behavior="pinned">
            <AppBarTitle size="lg">Notes</AppBarTitle>
          </AppBar>
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
        </PageBoundary>
      )}
    </PageTransition>
  </div>
)`,
      },
      {
        name: 'Sheet',
        description:
          'sheet({ type: "blur" }) for compose, filters and other temporary tasks. The page behind recedes and blurs.',
        renderFn: `const [path, setPath] = React.useState('/notes')
return (
  <div className="h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="min-h-full">
      {path === '/compose' ? (
        <PageBoundary path="/compose" className="flex min-h-full flex-col bg-background">
          <AppBar behavior="pinned" glass={false}>
            <AppBarTitle>New note</AppBarTitle>
            <AppBarActions>
              <AppBarBackButton icon="close" onClick={() => setPath('/notes')} />
            </AppBarActions>
          </AppBar>
          <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
            <Textarea placeholder="What happened today?" className="flex-1" autoFocus />
            <Button onClick={() => setPath('/notes')}>Save</Button>
          </div>
        </PageBoundary>
      ) : (
        <PageBoundary path="/notes" className="min-h-full bg-background">
          <AppBar behavior="pinned">
            <AppBarTitle size="lg">Notes</AppBarTitle>
            <AppBarActions>
              <Button variant="ghost" size="icon" aria-label="New note" onClick={() => setPath('/compose')}>
                <PenLine />
              </Button>
            </AppBarActions>
          </AppBar>
          <ul className="px-5 pb-4">
            {NOTES.map((n) => (
              <li key={n.id} className="border-b border-border py-3 last:border-0">
                <p className="text-label font-semibold text-foreground">{n.title}</p>
                <p className="text-caption text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </PageBoundary>
      )}
    </PageTransition>
  </div>
)`,
      },
      {
        name: 'Tabs',
        description:
          'ordered + slide(): the tab order decides the direction. Keep the bottom nav outside the boundary so only the content moves.',
        renderFn: `const TABS = [
  { value: '/home', label: 'Home', icon: <House /> },
  { value: '/explore', label: 'Explore', icon: <Compass /> },
  { value: '/me', label: 'Profile', icon: <User /> },
]
const [tab, setTab] = React.useState('/home')
const current = TABS.find((t) => t.value === tab) ?? TABS[0]
return (
  <div className="h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="flex min-h-full flex-col">
      <PageBoundary path={tab} className="flex-1 bg-background">
        <AppBar behavior="flow" glass={false}>
          <AppBarTitle size="lg">{current.label}</AppBarTitle>
        </AppBar>
        <div className="space-y-3 px-4 pb-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 rounded-control bg-muted" />
          ))}
        </div>
      </PageBoundary>
      <BottomNav value={tab} onValueChange={setTab}>
        {TABS.map((t) => (
          <BottomNavItem key={t.value} value={t.value} label={t.label} icon={t.icon} />
        ))}
      </BottomNav>
    </PageTransition>
  </div>
)`,
      },
    ],
  },
]
