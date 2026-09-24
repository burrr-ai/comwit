export const specs = [
  {
    title: 'TimePicker',
    slug: 'time-picker',
    covers: ['time-picker'],
    imports: [{ from: '@comwit/ui-templates/time-picker', names: ['TimePicker'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description:
          'A field trigger that opens a glass list of time slots (a bottom sheet on mobile). value is HH:mm, 24-hour.',
        renderFn: `const [value, setValue] = React.useState('09:30')
return (
  <div className="w-64">
    <TimePicker value={value} onChange={setValue} />
  </div>
)`,
      },
      {
        name: 'StepMinutes',
        description: 'stepMinutes sets the slot interval — 15 and 60 minutes here (default 30).',
        renderFn: `const [start, setStart] = React.useState('')
const [end, setEnd] = React.useState('')
return (
  <div className="flex w-64 flex-col gap-3">
    <TimePicker value={start} onChange={setStart} stepMinutes={15} placeholder="Start time" />
    <TimePicker value={end} onChange={setEnd} stepMinutes={60} placeholder="End time" />
    <p className="text-caption text-muted-foreground">
      {start && end ? 'Meeting: ' + start + ' – ' + end : 'Pick a start and end time'}
    </p>
  </div>
)`,
      },
      {
        name: 'LocaleAndTitle',
        description:
          'locale="en-GB" formats slots in 24-hour time; title names the mobile bottom sheet.',
        renderFn: `const [value, setValue] = React.useState('18:30')
return (
  <div className="w-64">
    <TimePicker value={value} onChange={setValue} locale="en-GB" title="Delivery window" />
  </div>
)`,
      },
      {
        name: 'Disabled',
        renderFn: `const [value, setValue] = React.useState('14:00')
return (
  <div className="w-64">
    <TimePicker value={value} onChange={setValue} disabled />
  </div>
)`,
      },
    ],
  },
]
