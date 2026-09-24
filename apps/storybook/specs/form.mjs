export const specs = [
  {
    title: 'Form',
    slug: 'form',
    covers: ['form'],
    imports: [
      {
        from: '@comwit/ui-templates/form',
        names: [
          'Form',
          'FormField',
          'FormItem',
          'FormLabel',
          'FormControl',
          'FormDescription',
          'FormMessage',
        ],
      },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [`import * as React from 'react'`, `import { useForm } from 'react-hook-form'`],
    stories: [
      {
        name: 'Default',
        description: 'react-hook-form 기반 — FormField 렌더 프롭으로 필드를 연결',
        renderFn: `const form = useForm({ defaultValues: { username: '' } })
return (
  <Form {...form}>
    <form className="w-80 space-y-6">
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>사용자 이름</FormLabel>
            <FormControl>
              <Input placeholder="이름을 입력하세요" {...field} />
            </FormControl>
            <FormDescription>공개 프로필에 표시되는 이름입니다.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </form>
  </Form>
)`,
      },
      {
        name: 'MultipleFields',
        description: '여러 FormField · Description · 제출 버튼',
        renderFn: `const form = useForm({ defaultValues: { username: '', email: '' } })
return (
  <Form {...form}>
    <form className="w-80 space-y-6" onSubmit={form.handleSubmit(() => {})}>
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>이름</FormLabel>
            <FormControl>
              <Input placeholder="홍길동" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>이메일</FormLabel>
            <FormControl>
              <Input type="email" placeholder="you@example.com" {...field} />
            </FormControl>
            <FormDescription>알림을 받을 이메일 주소입니다.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit">저장</Button>
    </form>
  </Form>
)`,
      },
      {
        name: 'WithValidation',
        description: '제출 버튼을 누르면 유효성 검사 오류(FormMessage)가 표시됩니다.',
        renderFn: `const form = useForm({ defaultValues: { email: '' } })
return (
  <Form {...form}>
    <form className="w-80 space-y-6" onSubmit={form.handleSubmit(() => {})}>
      <FormField
        control={form.control}
        name="email"
        rules={{
          required: '이메일을 입력해주세요.',
          minLength: { value: 5, message: '5자 이상 입력해주세요.' },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>이메일</FormLabel>
            <FormControl>
              <Input placeholder="you@example.com" {...field} />
            </FormControl>
            <FormDescription>필수 입력 항목입니다.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit">제출</Button>
    </form>
  </Form>
)`,
      },
      {
        name: 'Disabled',
        description: '비활성 필드 · 비활성 제출 버튼',
        renderFn: `const form = useForm({ defaultValues: { username: '차은우' } })
return (
  <Form {...form}>
    <form className="w-80 space-y-6">
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>사용자 이름</FormLabel>
            <FormControl>
              <Input disabled {...field} />
            </FormControl>
            <FormDescription>이 필드는 수정할 수 없습니다.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" disabled>저장</Button>
    </form>
  </Form>
)`,
      },
    ],
  },
]
