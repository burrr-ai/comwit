export const specs = [
  {
    title: 'DatePicker',
    slug: 'date-picker',
    covers: ['date-picker'],
    imports: [{ from: '@comwit/ui-templates/date-picker', names: ['DatePicker'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description:
          'A field trigger that opens a glass calendar popover (a bottom sheet on mobile). value is YYYY-MM-DD.',
        renderFn: `const [value, setValue] = React.useState('2026-09-25')
return (
  <div className="w-64">
    <DatePicker value={value} onChange={setValue} />
  </div>
)`,
      },
      {
        name: 'MinMax',
        description: 'min / max limit the selectable range; days outside it are disabled.',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="flex w-64 flex-col gap-2">
    <DatePicker
      value={value}
      onChange={setValue}
      min="2026-10-05"
      max="2026-10-23"
      placeholder="Select check-in date"
    />
    <p className="text-caption text-muted-foreground">
      {value ? 'Check-in: ' + value : 'Bookings open Oct 5 – Oct 23'}
    </p>
  </div>
)`,
      },
      {
        name: 'LocaleAndLabels',
        description:
          'locale drives the Intl date format and weekday names; labels override the panel copy.',
        renderFn: `const [value, setValue] = React.useState('2026-11-14')
return (
  <div className="w-64">
    <DatePicker
      value={value}
      onChange={setValue}
      locale="en-GB"
      labels={{
        title: 'Departure date',
        clear: 'Reset',
        today: 'Jump to today',
        previousMonth: 'Earlier',
        nextMonth: 'Later',
      }}
    />
  </div>
)`,
      },
      {
        name: 'Disabled',
        renderFn: `const [value, setValue] = React.useState('2026-09-25')
return (
  <div className="w-64">
    <DatePicker value={value} onChange={setValue} disabled />
  </div>
)`,
      },
    ],
  },
]
