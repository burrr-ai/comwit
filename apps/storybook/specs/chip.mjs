export const specs = [
  {
    title: 'Chip',
    covers: ['chip'],
    component: 'Chip',
    imports: [{ from: '@comwit/ui-templates/chip', names: ['Chip'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Filters',
        gallery: true,
        description:
          'Clickable chips toggle selected; status chips carry a tone; tags can be removed.',
        renderFn: `const topics = ['All', 'Design', 'Engineering', 'Marketing']
const [topic, setTopic] = React.useState('Design')
const [tags, setTags] = React.useState(['React', 'TypeScript', 'Tailwind'])
return (
  <div className="flex flex-col items-center gap-4">
    <div className="flex flex-wrap justify-center gap-2">
      {topics.map((t) => (
        <Chip key={t} selected={t === topic} onClick={() => setTopic(t)}>
          {t}
        </Chip>
      ))}
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      <Chip size="sm" tone="success">Shipped</Chip>
      <Chip size="sm" tone="warning">At risk</Chip>
      <Chip size="sm" tone="destructive">Blocked</Chip>
      <Chip size="sm" tone="info">In review</Chip>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      {tags.map((tag) => (
        <Chip
          key={tag}
          variant="outline"
          tone="brand"
          onDelete={() => setTags((all) => all.filter((t) => t !== tag))}
          deleteLabel={\`Remove \${tag}\`}
        >
          {tag}
        </Chip>
      ))}
    </div>
  </div>
)`,
      },
      {
        name: 'TonesAndVariants',
        description:
          'solid · soft · outline × neutral · brand · success · warning · destructive · info',
        render: `<div className="grid gap-3">
  {(['solid', 'soft', 'outline'] as const).map((variant) => (
    <div key={variant} className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 font-mono text-caption text-muted-foreground">{variant}</span>
      <Chip variant={variant} tone="neutral">Archived</Chip>
      <Chip variant={variant} tone="brand">Featured</Chip>
      <Chip variant={variant} tone="success">Shipped</Chip>
      <Chip variant={variant} tone="warning">At risk</Chip>
      <Chip variant={variant} tone="destructive">Blocked</Chip>
      <Chip variant={variant} tone="info">In review</Chip>
    </div>
  ))}
</div>`,
      },
      {
        name: 'Sizes',
        description: 'sm · md (default) · lg',
        render: `<div className="flex flex-wrap items-center gap-2">
  <Chip size="sm" tone="brand">Small</Chip>
  <Chip size="md" tone="brand">Medium</Chip>
  <Chip size="lg" tone="brand">Large</Chip>
</div>`,
      },
      {
        name: 'Removable',
        description:
          'onDelete adds a remove button. deleteLabel gives it an accessible name (default "Remove").',
        renderFn: `const initial = ['Paris', 'Tokyo', 'New York', 'Lisbon']
const [cities, setCities] = React.useState(initial)
return (
  <div className="flex flex-wrap items-center gap-2">
    {cities.map((city) => (
      <Chip
        key={city}
        onDelete={() => setCities((all) => all.filter((c) => c !== city))}
        deleteLabel={\`Remove \${city}\`}
      >
        {city}
      </Chip>
    ))}
    {cities.length < initial.length && (
      <Chip variant="outline" onClick={() => setCities(initial)}>
        Reset
      </Chip>
    )}
  </div>
)`,
      },
    ],
  },
]
