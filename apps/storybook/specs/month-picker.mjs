export const specs = [
  {
    title: 'MonthPicker',
    slug: 'month-picker',
    covers: ['month-picker'],
    imports: [{ from: '@comwit/ui-templates/month-picker', names: ['MonthPicker'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description:
          'A field trigger that opens a glass year view of twelve months. value is YYYY-MM.',
        renderFn: `const [value, setValue] = React.useState('2026-09')
return (
  <div className="w-64">
    <MonthPicker value={value} onChange={setValue} />
  </div>
)`,
      },
      {
        name: 'Controlled',
        description:
          'Starts empty with a placeholder; onChange reports YYYY-MM, or an empty string on clear.',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="flex w-64 flex-col gap-2">
    <MonthPicker value={value} onChange={setValue} placeholder="Select billing month" />
    <p className="text-caption text-muted-foreground">
      {value ? 'Invoice period: ' + value : 'No month selected'}
    </p>
  </div>
)`,
      },
      {
        name: 'MinMaxAndLabels',
        description:
          'min / max disable months outside the range; labels override the footer and navigation copy.',
        renderFn: `const [value, setValue] = React.useState('2026-06')
return (
  <div className="flex w-64 flex-col gap-2">
    <MonthPicker
      value={value}
      onChange={setValue}
      min="2026-01"
      max="2026-09"
      labels={{ clear: 'Reset', thisMonth: 'Current month', previousYear: 'Earlier', nextYear: 'Later' }}
    />
    <p className="text-caption text-muted-foreground">Reports are available from January to September 2026.</p>
  </div>
)`,
      },
      {
        name: 'Disabled',
        renderFn: `const [value, setValue] = React.useState('2026-09')
return (
  <div className="w-64">
    <MonthPicker value={value} onChange={setValue} disabled />
  </div>
)`,
      },
    ],
  },
]
