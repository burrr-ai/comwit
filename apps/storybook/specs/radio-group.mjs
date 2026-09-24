export const specs = [
  {
    title: 'RadioGroup',
    slug: 'radio-group',
    covers: ['radio-group'],
    imports: [
      {
        from: '@comwit/ui-templates/radio-group',
        names: ['RadioGroup', 'RadioGroupItem'],
      },
    ],
    stories: [
      {
        name: 'Default',
        description: '2~3개 항목 + 라벨, defaultValue 지정',
        render: `<RadioGroup defaultValue="pro" className="max-w-xs">
  {(
    [
      { value: 'free', label: '무료' },
      { value: 'pro', label: '프로' },
      { value: 'team', label: '팀' },
    ] as const
  ).map((option) => (
    <div key={option.value} className="flex items-center gap-3">
      <RadioGroupItem value={option.value} id={\`plan-\${option.value}\`} />
      <label htmlFor={\`plan-\${option.value}\`} className="cursor-pointer text-body">
        {option.label}
      </label>
    </div>
  ))}
</RadioGroup>`,
      },
      {
        name: 'Disabled',
        description: '개별 항목 비활성화 · 그룹 전체 비활성화',
        render: `<div className="flex flex-col gap-8">
  <RadioGroup defaultValue="a" className="max-w-xs">
    <div className="flex items-center gap-3">
      <RadioGroupItem value="a" id="disabled-a" />
      <label htmlFor="disabled-a" className="cursor-pointer text-body">옵션 A</label>
    </div>
    <div className="flex items-center gap-3">
      <RadioGroupItem value="b" id="disabled-b" disabled />
      <label htmlFor="disabled-b" className="text-body text-muted-foreground">옵션 B (비활성)</label>
    </div>
  </RadioGroup>
  <RadioGroup defaultValue="x" disabled className="max-w-xs">
    <div className="flex items-center gap-3">
      <RadioGroupItem value="x" id="group-disabled-x" />
      <label htmlFor="group-disabled-x" className="text-body text-muted-foreground">그룹 전체 비활성 X</label>
    </div>
    <div className="flex items-center gap-3">
      <RadioGroupItem value="y" id="group-disabled-y" />
      <label htmlFor="group-disabled-y" className="text-body text-muted-foreground">그룹 전체 비활성 Y</label>
    </div>
  </RadioGroup>
</div>`,
      },
    ],
  },
]
