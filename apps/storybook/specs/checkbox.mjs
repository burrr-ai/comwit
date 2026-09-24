export const specs = [
  {
    title: 'Checkbox',
    slug: 'checkbox',
    covers: ['checkbox'],
    component: 'Checkbox',
    imports: [
      { from: '@comwit/ui-templates/checkbox', names: ['Checkbox'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    stories: [
      {
        name: 'Default',
        description: 'Label 과 함께 연결(id/htmlFor)',
        render: `<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">이용약관에 동의합니다</Label>
</div>`,
      },
      {
        name: 'States',
        description: 'default · defaultChecked · disabled · disabled+checked',
        render: `<div className="flex flex-col gap-4">
  {([
    { id: 'st-default', label: '기본', props: {} },
    { id: 'st-checked', label: '선택됨', props: { defaultChecked: true } },
    { id: 'st-disabled', label: '비활성', props: { disabled: true } },
    { id: 'st-disabled-checked', label: '비활성 · 선택됨', props: { disabled: true, defaultChecked: true } },
  ] as const).map(({ id, label, props }) => (
    <div key={id} className="flex items-center gap-2">
      <Checkbox id={id} {...props} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  ))}
</div>`,
      },
      {
        name: 'DefaultChecked',
        description: '초기 선택 상태 (비제어)',
        render: `<div className="flex items-center gap-2">
  <Checkbox id="newsletter" defaultChecked />
  <Label htmlFor="newsletter">뉴스레터 수신에 동의합니다</Label>
</div>`,
      },
      {
        name: 'Disabled',
        render: `<div className="flex items-center gap-2">
  <Checkbox id="disabled-only" disabled />
  <Label htmlFor="disabled-only">비활성화된 옵션</Label>
</div>`,
      },
    ],
  },
]
