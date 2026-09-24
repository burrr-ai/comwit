export const specs = [
  {
    title: 'Collapsible',
    slug: 'collapsible',
    covers: ['collapsible'],
    imports: [
      {
        from: '@comwit/ui-templates/collapsible',
        names: ['Collapsible', 'CollapsibleTrigger', 'CollapsibleContent'],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { ChevronDown, ChevronsUpDown, Lock } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Repositories',
        gallery: true,
        description: 'The first row stays visible; the trigger reveals the rest.',
        render: `<Collapsible className="grid w-80 gap-2">
  <div className="flex items-center justify-between gap-4 pl-1">
    <p className="text-body-sm font-semibold text-foreground">Morgan starred 3 repositories</p>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="icon" className="size-8" aria-label="Toggle repositories">
        <ChevronsUpDown />
      </Button>
    </CollapsibleTrigger>
  </div>
  <div className="rounded-control border border-border px-4 py-2.5 font-mono text-body-sm text-foreground">
    comwit/state
  </div>
  <CollapsibleContent className="grid gap-2">
    <div className="rounded-control border border-border px-4 py-2.5 font-mono text-body-sm text-foreground">
      comwit/ui
    </div>
    <div className="rounded-control border border-border px-4 py-2.5 font-mono text-body-sm text-foreground">
      comwit/templates
    </div>
  </CollapsibleContent>
</Collapsible>`,
      },
      {
        name: 'Controlled',
        description: 'Control open with React.useState so the trigger label can follow the state.',
        renderFn: `const [open, setOpen] = React.useState(false)
return (
  <Collapsible open={open} onOpenChange={setOpen} className="grid w-80 gap-3">
    <div className="grid gap-1 text-body-sm">
      <p className="font-semibold text-foreground">Webhook endpoint</p>
      <p className="font-mono text-soft-foreground">https://api.acme.dev/hooks/orders</p>
    </div>
    <CollapsibleContent className="grid gap-1 rounded-control bg-muted px-4 py-3 text-body-sm text-soft-foreground">
      <p>Retries: 5 with exponential backoff</p>
      <p>Timeout: 10 seconds</p>
      <p>Signing secret: rotated 12 days ago</p>
    </CollapsibleContent>
    <CollapsibleTrigger asChild>
      <Button variant="link" size="sm" className="w-fit px-0">
        {open ? 'Hide advanced options' : 'Show advanced options'}
        <ChevronDown className={open ? 'rotate-180' : undefined} />
      </Button>
    </CollapsibleTrigger>
  </Collapsible>
)`,
      },
      {
        name: 'Disabled',
        description: 'disabled keeps the section closed and disables the trigger.',
        render: `<Collapsible disabled className="grid w-80 gap-2">
  <CollapsibleTrigger asChild>
    <Button variant="outline" className="justify-between">
      Billing history
      <Lock />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="rounded-control border border-border px-4 py-2.5 text-body-sm text-soft-foreground">
    Available on the Pro plan.
  </CollapsibleContent>
</Collapsible>`,
      },
    ],
  },
]
