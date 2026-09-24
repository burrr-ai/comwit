export const specs = [
  {
    title: 'TextField',
    slug: 'text-field',
    covers: ['text-field'],
    imports: [
      { from: '@comwit/ui-templates/text-field', names: ['TextField'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/textarea', names: ['Textarea'] },
    ],
    stories: [
      {
        name: 'Variants',
        description: '4가지 variant (outlined · filled · standard · stacked)',
        render: `<div className="grid max-w-sm gap-8">
  {(['outlined', 'filled', 'standard', 'stacked'] as const).map((variant) => (
    <TextField key={variant} variant={variant} label="이름" description={variant}>
      <Input placeholder="홍길동" />
    </TextField>
  ))}
</div>`,
      },
      {
        name: 'WithValue',
        description: '값이 있으면 라벨이 떠오른 상태(플로팅)',
        render: `<div className="grid max-w-sm gap-8">
  {(['outlined', 'filled', 'standard', 'stacked'] as const).map((variant) => (
    <TextField key={variant} variant={variant} label="이메일">
      <Input type="email" defaultValue="hong@comwit.ai" />
    </TextField>
  ))}
</div>`,
      },
      {
        name: 'Required',
        description: 'required 표시(*) + description',
        render: `<TextField label="이름" required description="실명을 입력하세요" className="max-w-sm">
  <Input placeholder="홍길동" />
</TextField>`,
      },
      {
        name: 'Error',
        description: 'error 지정 시 invalid 상태 + 에러 메시지',
        render: `<div className="grid max-w-sm gap-8">
  {(['outlined', 'filled', 'standard', 'stacked'] as const).map((variant) => (
    <TextField key={variant} variant={variant} label="이메일" error="올바른 이메일이 아닙니다">
      <Input type="email" defaultValue="hong@" />
    </TextField>
  ))}
</div>`,
      },
      {
        name: 'Disabled',
        render: `<TextField label="이름" disabled description="수정할 수 없습니다" className="max-w-sm">
  <Input defaultValue="홍길동" />
</TextField>`,
      },
      {
        name: 'WithTextarea',
        description: 'Input 대신 Textarea 를 컨트롤로 사용',
        render: `<TextField label="자기소개" description="500자 이내" className="max-w-sm">
  <Textarea placeholder="자유롭게 작성해 주세요" />
</TextField>`,
      },
    ],
  },
]
