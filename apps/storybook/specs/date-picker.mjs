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
        description: '제어 컴포넌트 · value(YYYY-MM-DD) / onChange',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="w-[280px] space-y-2">
    <DatePicker value={value} onChange={setValue} />
    <p className="text-caption text-muted-foreground">선택값: {value || '(없음)'}</p>
  </div>
)`,
      },
      {
        name: 'Placeholder',
        description: '값이 없을 때 표시되는 placeholder',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="w-[280px]">
    <DatePicker value={value} onChange={setValue} placeholder="예약일을 선택하세요" />
  </div>
)`,
      },
      {
        name: 'Preselected',
        description: '초기 선택값이 있는 상태',
        renderFn: `const [value, setValue] = React.useState('2026-07-03')
return (
  <div className="w-[280px]">
    <DatePicker value={value} onChange={setValue} />
  </div>
)`,
      },
      {
        name: 'MinMax',
        description: 'min / max 로 선택 가능 범위 제한',
        renderFn: `const [value, setValue] = React.useState('2026-07-15')
return (
  <div className="w-[280px] space-y-2">
    <DatePicker value={value} onChange={setValue} min="2026-07-10" max="2026-07-20" />
    <p className="text-caption text-muted-foreground">2026-07-10 ~ 2026-07-20 범위만 선택 가능</p>
  </div>
)`,
      },
      {
        name: 'Disabled',
        description: '비활성화 상태',
        renderFn: `const [value, setValue] = React.useState('2026-07-03')
return (
  <div className="w-[280px]">
    <DatePicker value={value} onChange={setValue} disabled />
  </div>
)`,
      },
    ],
  },
]
