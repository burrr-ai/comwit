export const specs = [
  {
    title: 'Select',
    slug: 'select',
    covers: ['select'],
    imports: [
      {
        from: '@comwit/ui-templates/select',
        names: [
          'Select',
          'SelectTrigger',
          'SelectValue',
          'SelectContent',
          'SelectItem',
          'SelectGroup',
          'SelectLabel',
          'SelectSeparator',
        ],
      },
    ],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        description: 'placeholder + 3개 옵션',
        render: `<Select>
  <SelectTrigger className="w-56">
    <SelectValue placeholder="옵션을 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">옵션 A</SelectItem>
    <SelectItem value="b">옵션 B</SelectItem>
    <SelectItem value="c">옵션 C</SelectItem>
  </SelectContent>
</Select>`,
      },
      {
        name: 'Sizes',
        description: 'trigger size — sm · default',
        render: `<div className="flex flex-wrap items-start gap-3">
  {(['sm', 'default'] as const).map((size) => (
    <Select key={size}>
      <SelectTrigger size={size} className="w-56">
        <SelectValue placeholder={size} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">옵션 A</SelectItem>
        <SelectItem value="b">옵션 B</SelectItem>
        <SelectItem value="c">옵션 C</SelectItem>
      </SelectContent>
    </Select>
  ))}
</div>`,
      },
      {
        name: 'Grouped',
        description: 'SelectGroup · SelectLabel · SelectSeparator',
        render: `<Select defaultValue="a">
  <SelectTrigger className="w-56">
    <SelectValue placeholder="옵션을 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>그룹 1</SelectLabel>
      <SelectItem value="a">옵션 A</SelectItem>
      <SelectItem value="b">옵션 B</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>그룹 2</SelectLabel>
      <SelectItem value="c">옵션 C</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
      },
      {
        name: 'Disabled',
        description: '전체 비활성 · 개별 옵션 비활성',
        render: `<div className="flex flex-wrap items-start gap-3">
  <Select disabled>
    <SelectTrigger className="w-56">
      <SelectValue placeholder="비활성" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">옵션 A</SelectItem>
      <SelectItem value="b">옵션 B</SelectItem>
      <SelectItem value="c">옵션 C</SelectItem>
    </SelectContent>
  </Select>
  <Select>
    <SelectTrigger className="w-56">
      <SelectValue placeholder="옵션 B 비활성" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">옵션 A</SelectItem>
      <SelectItem value="b" disabled>옵션 B</SelectItem>
      <SelectItem value="c">옵션 C</SelectItem>
    </SelectContent>
  </Select>
</div>`,
      },
      {
        name: 'Invalid',
        description: 'aria-invalid — 오류 상태 트리거',
        render: `<Select>
  <SelectTrigger aria-invalid className="w-56">
    <SelectValue placeholder="옵션을 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">옵션 A</SelectItem>
    <SelectItem value="b">옵션 B</SelectItem>
    <SelectItem value="c">옵션 C</SelectItem>
  </SelectContent>
</Select>`,
      },
      {
        name: 'Controlled',
        description: 'value/onValueChange 로 제어 · 선택값 표시',
        renderFn: `const [value, setValue] = React.useState<string>('')
return (
  <div className="flex flex-col gap-3">
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="옵션을 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">옵션 A</SelectItem>
        <SelectItem value="b">옵션 B</SelectItem>
        <SelectItem value="c">옵션 C</SelectItem>
      </SelectContent>
    </Select>
    <p className="text-sm text-muted-foreground">
      선택된 값: {value || '(없음)'}
    </p>
  </div>
)`,
      },
    ],
  },
]
