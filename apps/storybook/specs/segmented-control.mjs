export const specs = [
  {
    title: 'SegmentedControl',
    slug: 'segmented-control',
    covers: ['segmented-control'],
    imports: [{ from: '@comwit/ui-templates/segmented-control', names: ['SegmentedControl'] }],
    extraImports: [
      `import * as React from 'react'`,
      `import { Columns3, List } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'StatusFilter',
        gallery: true,
        description:
          'A white pill on a recessed track. value may be null for an "All" option; count adds a small badge.',
        renderFn: `const [status, setStatus] = React.useState<string | null>('open')
return (
  <SegmentedControl
    aria-label="Filter by status"
    size="md"
    value={status}
    onValueChange={setStatus}
    options={[
      { label: 'All', value: null },
      { label: 'Open', value: 'open', count: 12 },
      { label: 'In review', value: 'review', count: 4 },
      { label: 'Closed', value: 'closed' },
    ]}
  />
)`,
      },
      {
        name: 'Sizes',
        description: 'sm (default) for toolbars, md for page-level filters.',
        renderFn: `const [range, setRange] = React.useState('week')
const [period, setPeriod] = React.useState('monthly')
return (
  <div className="flex flex-col items-start gap-4">
    <SegmentedControl
      aria-label="Date range"
      value={range}
      onValueChange={setRange}
      options={[
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'Month', value: 'month' },
        { label: 'Year', value: 'year' },
      ]}
    />
    <SegmentedControl
      aria-label="Billing period"
      size="md"
      value={period}
      onValueChange={setPeriod}
      options={[
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly · save 20%', value: 'yearly' },
      ]}
    />
  </div>
)`,
      },
      {
        name: 'ViewSwitcher',
        description:
          'Labels can hold icons. The choice applies immediately, so drive the view from the same state.',
        renderFn: `const [view, setView] = React.useState<'list' | 'board'>('list')
return (
  <div className="grid w-72 gap-3">
    <SegmentedControl
      aria-label="Layout"
      value={view}
      onValueChange={setView}
      className="w-fit"
      options={[
        { label: <><List className="size-4" /> List</>, value: 'list' },
        { label: <><Columns3 className="size-4" /> Board</>, value: 'board' },
      ]}
    />
    <p className="rounded-control border border-border px-4 py-3 text-body-sm text-soft-foreground">
      {view === 'list' ? 'Showing 24 tasks as a list.' : 'Showing 24 tasks in 4 columns.'}
    </p>
  </div>
)`,
      },
    ],
  },
]
