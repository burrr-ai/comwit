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
        names: ['PageTransition', 'PageBoundary', 'drill', 'sheet', 'hero', 'slide'],
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
      `const PHOTOS = [
  { id: 'peak', title: 'Sunrise peak', tone: 'from-amber-300 to-rose-500' },
  { id: 'beach', title: 'Hyeopjae beach', tone: 'from-sky-300 to-blue-700' },
  { id: 'forest', title: 'Bijarim forest', tone: 'from-lime-300 to-teal-700' },
  { id: 'market', title: 'Night market', tone: 'from-pink-300 to-indigo-800' },
]`,
      `// Rules describe navigation pairs; presets describe the motion. Back replays the pair in reverse.
const transitions = {
  transitions: [
    // list → detail drills in; Back drills out and restores the list's scroll.
    { on: '/notes/**', except: '/notes', transition: drill() },
    // a temporary task rises over the page and blurs it
    { on: '/compose', transition: sheet({ type: 'blur' }) },
    // the photo marked with the same key on both pages travels between them
    { from: '/photos', to: '/photos/*', transition: hero({ type: 'fade' }) },
    // tabs slide by their order; the shell around them stays put
    { ordered: ['/home', '/explore', '/me'], transition: slide() },
  ],
}`,
    ],
    stories: [
      {
        name: 'Drill',
        gallery: true,
        description:
          'One keyed boundary marks the page. PageTransition lays the shell the leaving page needs (relative · z-0 · overflow-x-clip); inside your own scroller give it min-h-full and give every page a background.',
        renderFn: `const [path, setPath] = React.useState('/notes')
const note = NOTES.find((n) => '/notes/' + n.id === path)
return (
  <div className="h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
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
  <div className="h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="min-h-full">
      <PageBoundary path={path} className="flex min-h-full flex-col bg-background">
        {path === '/compose' ? (
          <>
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
        name: 'Hero',
        description:
          'hero(): mark the shared element with data-hero-exit-key on the page you leave and data-hero-enter-key on the page you enter, same value on both, plus data-hero-radius (px) on each end so the corner radius morphs with the box. The engine morphs it across; type: "fade" crossfades the rest.',
        renderFn: `const [path, setPath] = React.useState('/photos')
const photo = PHOTOS.find((p) => '/photos/' + p.id === path)
return (
  <div className="h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="min-h-full">
      <PageBoundary path={path} className="min-h-full bg-background">
        {photo ? (
          <>
            <div
              data-hero-enter-key={photo.id}
              data-hero-radius={0}
              className={'h-56 w-full bg-linear-to-br ' + photo.tone}
            />
            <div className="flex items-center gap-2 px-4 py-3">
              <AppBarBackButton onClick={() => setPath('/photos')} />
              <h4 className="text-title-md text-foreground">{photo.title}</h4>
            </div>
            <p className="px-5 pb-6 text-body-sm text-soft-foreground">
              The photo travelled from the grid. Go back and it settles into its tile again.
            </p>
          </>
        ) : (
          <>
            <AppBar behavior="pinned">
              <AppBarTitle size="lg">Photos</AppBarTitle>
            </AppBar>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {PHOTOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={'Open ' + p.title}
                  onClick={() => setPath('/photos/' + p.id)}
                  className="overflow-hidden rounded-card text-left"
                >
                  <div
                    data-hero-exit-key={p.id}
                    data-hero-radius={16}
                    className={'h-32 w-full bg-linear-to-br ' + p.tone}
                  />
                  <span className="block px-1 pt-2 text-label font-medium text-foreground">{p.title}</span>
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
  <div className="h-96 w-full max-w-sm overflow-x-clip overflow-y-auto rounded-card bg-muted">
    <PageTransition config={transitions} className="flex min-h-full flex-col">
      <PageBoundary path={tab} routeKey="tabs" className="flex min-h-full flex-1 flex-col bg-background">
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
      </PageBoundary>
    </PageTransition>
  </div>
)`,
      },
    ],
  },
]
