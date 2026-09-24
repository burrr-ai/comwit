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
        description: '제어형 · value(YYYY-MM) / onChange',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="w-[280px] space-y-2">
    <MonthPicker value={value} onChange={setValue} />
    <p className="text-caption text-muted-foreground">
      선택된 값: {value || '(없음)'}
    </p>
  </div>
)`,
      },
      {
        name: 'WithValue',
        description: '초기 선택 값이 있는 상태',
        renderFn: `const [value, setValue] = React.useState('2026-07')
return (
  <div className="w-[280px]">
    <MonthPicker value={value} onChange={setValue} />
  </div>
)`,
      },
      {
        name: 'Placeholder',
        description: '커스텀 placeholder',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="w-[280px]">
    <MonthPicker
      value={value}
      onChange={setValue}
      placeholder="정산 월을 선택하세요"
    />
  </div>
)`,
      },
      {
        name: 'MinMax',
        description: 'min / max 로 선택 가능한 월 범위 제한',
        renderFn: `const [value, setValue] = React.useState('2026-07')
return (
  <div className="w-[280px] space-y-2">
    <MonthPicker
      value={value}
      onChange={setValue}
      min="2026-03"
      max="2026-10"
    />
    <p className="text-caption text-muted-foreground">
      2026년 3월 ~ 10월만 선택 가능
    </p>
  </div>
)`,
      },
      {
        name: 'Disabled',
        description: '비활성화 상태',
        renderFn: `const [value, setValue] = React.useState('2026-07')
return (
  <div className="w-[280px]">
    <MonthPicker value={value} onChange={setValue} disabled />
  </div>
)`,
      },
    ],
  },
]
