export const specs = [
  {
    title: 'Calendar',
    slug: 'calendar',
    covers: ['calendar'],
    imports: [{ from: '@comwit/ui-templates/calendar', names: ['Calendar'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Range',
        gallery: true,
        description: 'mode="range" — pill-shaped start and end days joined by a selected band.',
        renderFn: `const [range, setRange] = React.useState<{ from: Date | undefined; to?: Date } | undefined>({
  from: new Date(2026, 1, 9),
  to: new Date(2026, 1, 13),
})
return (
  <Calendar
    mode="range"
    defaultMonth={new Date(2026, 1, 1)}
    selected={range}
    onSelect={setRange}
    className="rounded-card border border-border"
  />
)`,
      },
      {
        name: 'Single',
        description: 'mode="single" — a controlled calendar that selects one day.',
        renderFn: `const [date, setDate] = React.useState<Date | undefined>(new Date())
return (
  <div className="flex flex-col items-center gap-2">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-card border border-border"
    />
    <p className="text-caption text-muted-foreground">
      {date
        ? 'Due ' + date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        : 'No due date'}
    </p>
  </div>
)`,
      },
      {
        name: 'DisabledDays',
        description: 'disabled matchers — past days and weekends cannot be booked.',
        renderFn: `const [date, setDate] = React.useState<Date | undefined>()
return (
  <Calendar
    mode="single"
    selected={date}
    onSelect={setDate}
    disabled={[{ before: new Date() }, { dayOfWeek: [0, 6] }]}
    className="rounded-card border border-border"
  />
)`,
      },
      {
        name: 'Multiple',
        description: 'mode="multiple" — pick several days, capped with max.',
        renderFn: `const [days, setDays] = React.useState<Date[] | undefined>([])
return (
  <div className="flex flex-col items-center gap-2">
    <Calendar
      mode="multiple"
      max={5}
      selected={days}
      onSelect={setDays}
      className="rounded-card border border-border"
    />
    <p className="text-caption text-muted-foreground">
      {days?.length ?? 0} of 5 office days selected
    </p>
  </div>
)`,
      },
    ],
  },
]
