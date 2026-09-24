export const specs = [
  {
    title: 'Textarea',
    slug: 'textarea',
    covers: ['textarea'],
    component: 'Textarea',
    imports: [{ from: '@comwit/ui-templates/textarea', names: ['Textarea'] }],
    stories: [
      {
        name: 'Default',
        render: `<Textarea placeholder="내용을 입력하세요" defaultValue="안녕하세요. 여러 줄의 텍스트를 입력할 수 있습니다." />`,
      },
      {
        name: 'Invalid',
        description: 'aria-invalid 상태',
        render: `<Textarea aria-invalid defaultValue="잘못된 입력입니다" placeholder="내용을 입력하세요" />`,
      },
      {
        name: 'Disabled',
        render: `<Textarea disabled defaultValue="비활성화된 텍스트 영역" placeholder="내용을 입력하세요" />`,
      },
    ],
  },
]
