export const specs = [
  {
    title: 'Pager',
    slug: 'pager',
    covers: ['pager'],
    imports: [{ from: '@comwit/ui-templates/pager', names: ['Pager'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Interactive',
        gallery: true,
        description:
          'Give it page, totalPages and onChange. Long ranges collapse to 1 … 4 5 6 … 12.',
        renderFn: `const [page, setPage] = React.useState(5)
return <Pager page={page} totalPages={12} onChange={setPage} />`,
      },
      {
        name: 'FewPages',
        description: 'Up to 7 pages are all shown; previous and next disable at the ends.',
        renderFn: `const [page, setPage] = React.useState(1)
return <Pager page={page} totalPages={5} onChange={setPage} />`,
      },
      {
        name: 'WithSummary',
        description:
          'Pair it with a result count in a list footer, and localize the labels for screen readers.',
        renderFn: `const perPage = 10
const total = 118
const [page, setPage] = React.useState(3)
const start = (page - 1) * perPage + 1
const end = Math.min(page * perPage, total)
return (
  <div className="flex w-full max-w-xl flex-wrap items-center justify-between gap-2 border-t border-border px-2">
    <p className="text-body-sm tabular-nums text-soft-foreground">
      Showing {start}–{end} of {total} results
    </p>
    <Pager
      page={page}
      totalPages={Math.ceil(total / perPage)}
      onChange={setPage}
      className="py-3"
      labels={{ nav: 'Search results pages', page: (p) => \`Go to results page \${p}\` }}
    />
  </div>
)`,
      },
      {
        name: 'AlwaysShow',
        description: 'Pager renders nothing for a single page unless alwaysShow is set.',
        renderFn: `const [page, setPage] = React.useState(1)
return <Pager page={page} totalPages={1} onChange={setPage} alwaysShow />`,
      },
    ],
  },
]
