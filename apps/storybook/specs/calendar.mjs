export const specs = [
  {
    title: 'Calendar',
    slug: 'calendar',
    covers: ['calendar'],
    imports: [{ from: '@comwit/ui-templates/calendar', names: ['Calendar'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Single',
        description: 'mode="single" · 날짜 하나를 선택하는 controlled 캘린더',
        renderFn: `const [selected, setSelected] = React.useState<Date | undefined>(new Date())
return (
  <div className="space-y-2">
    <Calendar
      mode="single"
      selected={selected}
      onSelect={setSelected}
      className="rounded-md border"
    />
    <p className="text-caption text-muted-foreground">
      선택한 날짜: {selected ? selected.toLocaleDateString('ko-KR') : '없음'}
    </p>
  </div>
)`,
      },
      {
        name: 'Multiple',
        description: 'mode="multiple" · 여러 날짜를 선택',
        renderFn: `const [selected, setSelected] = React.useState<Date[] | undefined>([])
return (
  <div className="space-y-2">
    <Calendar
      mode="multiple"
      selected={selected}
      onSelect={setSelected}
      className="rounded-md border"
    />
    <p className="text-caption text-muted-foreground">
      선택한 날짜 수: {selected?.length ?? 0}개
    </p>
  </div>
)`,
      },
      {
        name: 'DisabledDates',
        description: 'disabled matcher 로 주말(일·토) 비활성화',
        renderFn: `const [selected, setSelected] = React.useState<Date | undefined>()
return (
  <Calendar
    mode="single"
    selected={selected}
    onSelect={setSelected}
    disabled={{ dayOfWeek: [0, 6] }}
    className="rounded-md border"
  />
)`,
      },
    ],
  },
]
