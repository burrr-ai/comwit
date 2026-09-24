export const specs = [
  {
    title: 'PullToRefresh',
    slug: 'pull-to-refresh',
    covers: ['pull-to-refresh'],
    imports: [{ from: '@comwit/ui-templates/pull-to-refresh', names: ['PullToRefresh'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Drag down from the top (touch or mouse) and let go',
        renderFn: `const [updated, setUpdated] = React.useState(() => new Date())
return (
  <div className="flex h-64 w-full max-w-sm flex-col overflow-hidden rounded-card bg-muted">
    <PullToRefresh
      onRefresh={() =>
        new Promise<void>((done) =>
          setTimeout(() => {
            setUpdated(new Date())
            done()
          }, 900)
        )
      }
    >
      <p className="px-4 pt-4 pb-2 text-caption text-muted-foreground">
        Updated {updated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
      </p>
      <div className="space-y-2 px-4 pb-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-12 rounded-control bg-card shadow-card" />
        ))}
      </div>
    </PullToRefresh>
  </div>
)`,
      },
    ],
  },
]
