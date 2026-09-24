export const specs = [
  {
    title: 'Button',
    covers: ['button'],
    component: 'Button',
    imports: [{ from: '@comwit/ui-templates/button', names: ['Button'] }],
    extraImports: [`import { Search } from 'lucide-react'`],
    stories: [
      { name: 'Default', render: `<Button>버튼</Button>` },
      {
        name: 'Variants',
        description: '6가지 variant',
        render: `<div className="flex flex-wrap items-center gap-3">
  {(['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const).map((v) => (
    <Button key={v} variant={v}>{v}</Button>
  ))}
</div>`,
      },
      {
        name: 'Sizes',
        render: `<div className="flex flex-wrap items-center gap-3">
  <Button size="sm">sm</Button>
  <Button size="default">default</Button>
  <Button size="lg">lg</Button>
  <Button size="icon" variant="outline" aria-label="검색"><Search /></Button>
</div>`,
      },
      { name: 'Disabled', render: `<Button disabled>disabled</Button>` },
    ],
  },
]
