export const specs = [
  {
    title: 'Chip',
    covers: ['chip'],
    component: 'Chip',
    imports: [{ from: '@comwit/ui-templates/chip', names: ['Chip'] }],
    stories: [
      {
        name: 'TonesAndVariants',
        description: 'variant × tone 매트릭스',
        render: `<div className="space-y-3">
  {(['tonal', 'filled', 'outline'] as const).map((variant) => (
    <div key={variant} className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 font-mono text-caption text-muted-foreground">{variant}</span>
      {(['neutral', 'primary', 'success', 'warning', 'destructive', 'info'] as const).map((tone) => (
        <Chip key={tone} variant={variant} tone={tone}>{tone}</Chip>
      ))}
    </div>
  ))}
</div>`,
      },
      {
        name: 'Interactive',
        description: 'selected(클릭) · onDelete(삭제)',
        render: `<div className="flex flex-wrap items-center gap-2">
  <Chip selected onClick={() => {}}>selected</Chip>
  <Chip onClick={() => {}}>clickable</Chip>
  <Chip variant="outline" onDelete={() => {}}>deletable</Chip>
</div>`,
      },
    ],
  },
]
