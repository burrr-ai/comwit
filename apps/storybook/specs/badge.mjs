export const specs = [
  {
    title: 'Badge',
    slug: 'badge',
    covers: ['badge'],
    docsOnly: true,
    imports: [{ from: '@comwit/ui-templates/badge', names: ['Badge'] }],
    extraImports: [`import { AlertTriangle, Check, Clock, Sparkles } from 'lucide-react'`],
    stories: [
      {
        name: 'Showcase',
        gallery: true,
        description: 'Small, non-interactive labels for status and metadata.',
        render: `<div className="flex max-w-sm flex-wrap items-center justify-center gap-2">
  <Badge>
    <Sparkles /> New
  </Badge>
  <Badge variant="success">
    <Check /> Paid
  </Badge>
  <Badge variant="warning">
    <Clock /> Pending
  </Badge>
  <Badge variant="destructive">
    <AlertTriangle /> Overdue
  </Badge>
  <Badge variant="info">Beta</Badge>
  <Badge variant="secondary">Draft</Badge>
  <Badge variant="outline">v2.4.0</Badge>
</div>`,
      },
      {
        name: 'Variants',
        description: 'default · secondary · outline · success · warning · destructive · info',
        render: `<div className="flex flex-wrap items-center gap-2">
  <Badge>Pro</Badge>
  <Badge variant="secondary">Archived</Badge>
  <Badge variant="outline">Internal</Badge>
  <Badge variant="success">Active</Badge>
  <Badge variant="warning">Trial ends soon</Badge>
  <Badge variant="destructive">Payment failed</Badge>
  <Badge variant="info">In review</Badge>
</div>`,
      },
      {
        name: 'InContext',
        description: 'Next to a title or in a list row, the badge carries the status at a glance.',
        render: `<div className="grid w-full max-w-sm gap-3">
  <div className="flex items-center gap-2">
    <p className="text-title-sm text-foreground">Pro plan</p>
    <Badge variant="secondary">Current</Badge>
  </div>
  <div className="flex items-center justify-between text-body-sm">
    <span className="text-foreground">Invoice #1042</span>
    <Badge variant="success">Paid</Badge>
  </div>
  <div className="flex items-center justify-between text-body-sm">
    <span className="text-foreground">Invoice #1043</span>
    <Badge variant="warning">Due in 3 days</Badge>
  </div>
</div>`,
      },
    ],
  },
]
