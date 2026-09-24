export const specs = [
  {
    title: 'Skeleton',
    slug: 'skeleton',
    covers: ['skeleton'],
    docsOnly: true,
    imports: [{ from: '@comwit/ui-templates/skeleton', names: ['Skeleton'] }],
    stories: [
      {
        name: 'PostCard',
        gallery: true,
        description: 'Match the shape of the content that is about to load.',
        render: `<div className="grid w-72 gap-4 rounded-card border border-border bg-card p-4">
  <div className="flex items-center gap-3">
    <Skeleton className="size-10 rounded-full" />
    <div className="grid flex-1 gap-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
  <Skeleton className="h-24 w-full rounded-lg" />
  <div className="grid gap-2">
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
  </div>
</div>`,
      },
      {
        name: 'Profile',
        description: 'Avatar with two lines of text.',
        render: `<div className="flex items-center gap-4">
  <Skeleton className="size-12 rounded-full" />
  <div className="grid gap-2">
    <Skeleton className="h-4 w-44" />
    <Skeleton className="h-4 w-28" />
  </div>
</div>`,
      },
      {
        name: 'List',
        description: 'Repeat one row shape for a loading list.',
        render: `<div className="grid w-full max-w-sm gap-4">
  {[0, 1, 2].map((row) => (
    <div key={row} className="flex items-center gap-3">
      <Skeleton className="size-9 rounded-lg" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-6 w-14 rounded-pill" />
    </div>
  ))}
</div>`,
      },
    ],
  },
]
