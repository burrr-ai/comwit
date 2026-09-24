export const specs = [
  {
    title: 'Input',
    slug: 'input',
    covers: ['input'],
    component: 'Input',
    imports: [{ from: '@comwit/ui-templates/input', names: ['Input'] }],
    stories: [
      { name: 'Default', render: `<Input defaultValue="홍길동" className="max-w-xs" />` },
      {
        name: 'Placeholder',
        render: `<Input placeholder="이름을 입력하세요" className="max-w-xs" />`,
      },
      {
        name: 'Invalid',
        description: 'aria-invalid 상태',
        render: `<Input aria-invalid defaultValue="잘못된 값" className="max-w-xs" />`,
      },
      {
        name: 'Disabled',
        render: `<Input disabled defaultValue="수정 불가" className="max-w-xs" />`,
      },
      {
        name: 'Types',
        description: 'email · password · number 타입',
        render: `<div className="flex max-w-xs flex-col gap-3">
  <Input type="email" placeholder="name@example.com" />
  <Input type="password" placeholder="비밀번호" defaultValue="secret" />
  <Input type="number" placeholder="0" defaultValue={42} />
</div>`,
      },
    ],
  },
]
