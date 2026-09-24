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
        description: '제어 컴포넌트 — value(HH:mm) + onChange',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="w-64 space-y-2">
    <TimePicker value={value} onChange={setValue} />
    <p className="text-caption text-muted-foreground">선택된 값: {value || '없음'}</p>
  </div>
)`,
      },
      {
        name: 'WithInitialValue',
        description: '초기값 09:30 → "오전 9시 30분"으로 표시',
        renderFn: `const [value, setValue] = React.useState('09:30')
return (
  <div className="w-64">
    <TimePicker value={value} onChange={setValue} />
  </div>
)`,
      },
      {
        name: 'StepMinutes',
        description: '슬롯 간격(분) — 15 · 30(기본) · 60',
        renderFn: `const [a, setA] = React.useState('')
const [b, setB] = React.useState('')
const [c, setC] = React.useState('')
return (
  <div className="w-64 space-y-4">
    {([['15분', 15, a, setA], ['30분(기본)', 30, b, setB], ['60분', 60, c, setC]] as const).map(
      ([label, step, val, set]) => (
        <div key={label} className="space-y-1">
          <span className="font-mono text-caption text-muted-foreground">{label}</span>
          <TimePicker value={val} onChange={set} stepMinutes={step} />
        </div>
      ),
    )}
  </div>
)`,
      },
      {
        name: 'Placeholder',
        description: 'placeholder 커스텀',
        renderFn: `const [value, setValue] = React.useState('')
return (
  <div className="w-64">
    <TimePicker value={value} onChange={setValue} placeholder="예약 시간을 선택하세요" />
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
