export const specs = [
  {
    title: 'AppBar',
    slug: 'app-bar',
    covers: ['app-bar'],
    component: 'AppBar',
    imports: [
      {
        from: '@comwit/ui-templates/app-bar',
        names: ['AppBar', 'AppBarTitle', 'AppBarActions', 'AppBarBackButton'],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [`import { Share, MoreHorizontal } from 'lucide-react'`],
    stories: [
      {
        name: 'Detail',
        gallery: true,
        description: 'Back button, title and actions over a fade glass surface',
        render: `<div className="h-40 w-full max-w-sm overflow-y-auto rounded-card bg-muted">
  <AppBar behavior="pinned">
    <AppBarBackButton onClick={() => {}} />
    <AppBarTitle>Trip to Jeju</AppBarTitle>
    <AppBarActions>
      <Button variant="ghost" size="icon" aria-label="Share"><Share /></Button>
    </AppBarActions>
  </AppBar>
  <div className="space-y-3 p-4">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="h-14 rounded-control bg-card shadow-card" />
    ))}
  </div>
</div>`,
      },
      {
        name: 'Sheet',
        description: 'Close icon for sheets — pinned, no glass circle',
        render: `<div className="w-full max-w-sm overflow-hidden rounded-card bg-card shadow-card">
  <AppBar behavior="flow">
    <AppBarTitle>Filters</AppBarTitle>
    <AppBarActions>
      <AppBarBackButton icon="close" onClick={() => {}} />
    </AppBarActions>
  </AppBar>
</div>`,
      },
      {
        name: 'TabRoot',
        description: 'Large title for a tab root',
        render: `<div className="w-full max-w-sm overflow-hidden rounded-card bg-card shadow-card">
  <AppBar behavior="flow">
    <AppBarTitle size="lg">Projects</AppBarTitle>
    <AppBarActions>
      <Button variant="ghost" size="icon" aria-label="More"><MoreHorizontal /></Button>
    </AppBarActions>
  </AppBar>
</div>`,
      },
    ],
  },
]
