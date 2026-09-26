export const specs = [
  {
    title: 'PageTransition',
    slug: 'page-transition',
    covers: ['page-transition'],
    // A state value stands in for the router. The contract is one keyed boundary: `path` is both the
    // React key and the route id, so whatever changes it (useState here, RouteBoundary reading your
    // router in an app) unmounts the old page and the engine animates the swap.
    imports: [
      {
        from: '@comwit/ui-templates/page-transition',
        names: ['PageTransition', 'PageBoundary', 'drill', 'sheet', 'zoom', 'slide'],
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
      `// Rules describe navigation pairs; presets describe the motion. Back replays the pair in reverse.
const transitions = {
  transitions: [
    // list → detail drills in; Back drills out and restores the list's scroll.
    { on: '/notes/**', except: '/notes', transition: drill() },
    // a temporary task rises over the page and blurs it
    { on: '/compose', transition: sheet({ type: 'blur' }) },
    // a tile expands into the photo it opens
    { from: '/photos', to: '/photos/*', transition: zoom({ type: 'expand' }) },
    // tabs slide by their order; the shell around them stays put
    { ordered: ['/home', '/explore', '/me'], transition: slide() },
  ],
}`,
      `const PHOTOS = [
  { id: 'peak', tone: 'from-amber-300 to-rose-500' },
  { id: 'beach', tone: 'from-sky-300 to-blue-700' },
  { id: 'forest', tone: 'from-lime-300 to-teal-700' },
  { id: 'market', tone: 'from-pink-300 to-indigo-800' },
  { id: 'dunes', tone: 'from-orange-200 to-amber-600' },
  { id: 'cliffs', tone: 'from-slate-400 to-slate-800' },
]`,
    ],
    stories: [
      {
        name: 'Drill',
        gallery: true,
        description:
          'One keyed boundary marks the page. PageTransition lays a layout-only shell (a flex column); inside your own scroller give it min-h-full. The scroller anchors, stacks and clips the leaving page: give it relative z-0 overflow-x-clip, which also keeps sticky bars steady while it scrolls. Give every page a background.',
        renderFn: `const [path, setPath] = React.useState('/notes')
const note = NOTES.find((n) => '/notes/' + n.id === path)
return (
  <div className="relative z-0 h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="min-h-full">
      <PageBoundary path={path} className="min-h-full bg-background">
        {note ? (
          <>
            <AppBar behavior="pinned">
              <AppBarBackButton onClick={() => setPath('/notes')} />
              <AppBarTitle>{note.title}</AppBarTitle>
            </AppBar>
            <p className="px-5 pt-2 pb-6 text-body text-soft-foreground">{note.body}</p>
          </>
        ) : (
          <>
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
          </>
        )}
      </PageBoundary>
    </PageTransition>
  </div>
)`,
      },
      {
        name: 'Sheet',
        description:
          'sheet({ type: "blur" }) for compose, filters and other temporary tasks. The page behind recedes and blurs; close it and it comes back untouched.',
        renderFn: `const [path, setPath] = React.useState('/notes')
return (
  <div className="relative z-0 h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="min-h-full">
      <PageBoundary path={path} className="flex min-h-full flex-col bg-background">
        {path === '/compose' ? (
          <>
            <AppBar behavior="pinned">
              <AppBarTitle>New note</AppBarTitle>
              <AppBarActions>
                <AppBarBackButton icon="close" onClick={() => setPath('/notes')} />
              </AppBarActions>
            </AppBar>
            <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
              <Textarea placeholder="What happened today?" className="flex-1" autoFocus />
              <Button onClick={() => setPath('/notes')}>Save</Button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </PageBoundary>
    </PageTransition>
  </div>
)`,
      },
      {
        name: 'Zoom',
        description:
          'zoom({ type: "expand" }): the tile you tap expands into the page. Mark the tile with data-zoom-exit-key and the photo with data-zoom-enter-key, same value on both.',
        renderFn: `const [path, setPath] = React.useState('/photos')
const photo = PHOTOS.find((p) => '/photos/' + p.id === path)
return (
  <div className="relative z-0 h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="min-h-full">
      <PageBoundary path={path} className="min-h-full bg-background">
        {photo ? (
          <>
            <div data-zoom-enter-key={photo.id} className={'aspect-square w-full bg-linear-to-br ' + photo.tone} />
            <div className="flex items-center gap-2 px-4 py-3">
              <AppBarBackButton onClick={() => setPath('/photos')} />
              <span className="text-title-md text-foreground capitalize">{photo.id}</span>
            </div>
          </>
        ) : (
          <>
            <AppBar behavior="pinned">
              <AppBarTitle size="lg">Photos</AppBarTitle>
            </AppBar>
            <div className="grid grid-cols-3 gap-0.5">
              {PHOTOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={'Open ' + p.id}
                  onClick={() => setPath('/photos/' + p.id)}
                  className="aspect-square"
                >
                  <div data-zoom-exit-key={p.id} className={'h-full w-full bg-linear-to-br ' + p.tone} />
                </button>
              ))}
            </div>
          </>
        )}
      </PageBoundary>
    </PageTransition>
  </div>
)`,
      },
      {
        name: 'Tabs',
        description:
          'A persistent shell: the outer boundary keeps a fixed routeKey so the bottom nav survives, and the inner boundary swaps the page. The app bar belongs to the page, so it slides with it, and nothing sits above the inner boundary, so the leaving page stays exactly where it was. ordered + slide(): the tab order decides the direction.',
        renderFn: `const TABS = [
  { value: '/home', label: 'Home', icon: <House /> },
  { value: '/explore', label: 'Explore', icon: <Compass /> },
  { value: '/me', label: 'Profile', icon: <User /> },
]
const [tab, setTab] = React.useState('/home')
const current = TABS.find((t) => t.value === tab) ?? TABS[0]
return (
  <div className="relative z-0 h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="flex min-h-full flex-col">
      <PageBoundary path={tab} routeKey="tabs" className="flex min-h-full flex-1 flex-col bg-background">
        <PageBoundary path={tab} className="flex-1 bg-background">
          <AppBar behavior="flow">
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
      </PageBoundary>
    </PageTransition>
  </div>
)`,
      },
    ],
  },
]
