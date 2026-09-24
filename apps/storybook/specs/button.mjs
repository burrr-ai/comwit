export const specs = [
  {
    title: 'Button',
    covers: ['button'],
    component: 'Button',
    imports: [{ from: '@comwit/ui-templates/button', names: ['Button'] }],
    extraImports: [
      `import { ArrowRight, Download, Loader2, Plus, Search, Trash2 } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Showcase',
        gallery: true,
        description:
          'Pill-shaped actions from primary to quiet, with icons and an icon-only button.',
        render: `<div className="flex flex-col items-center gap-3">
  <div className="flex flex-wrap items-center justify-center gap-2">
    <Button size="lg">
      Get started <ArrowRight />
    </Button>
    <Button size="lg" variant="secondary">Book a demo</Button>
  </div>
  <div className="flex flex-wrap items-center justify-center gap-2">
    <Button variant="outline">
      <Download /> Export
    </Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">
      <Trash2 /> Delete
    </Button>
    <Button size="icon" variant="outline" aria-label="Search">
      <Search />
    </Button>
  </div>
</div>`,
      },
      {
        name: 'Variants',
        description: 'default · secondary · outline · ghost · link · destructive',
        render: `<div className="flex flex-wrap items-center gap-3">
  <Button>Save changes</Button>
  <Button variant="secondary">Duplicate</Button>
  <Button variant="outline">Share</Button>
  <Button variant="ghost">Cancel</Button>
  <Button variant="link">View docs</Button>
  <Button variant="destructive">Delete project</Button>
</div>`,
      },
      {
        name: 'Sizes',
        description: 'sm · default · lg, plus a square icon size that needs an aria-label.',
        render: `<div className="flex flex-wrap items-center gap-3">
  <Button size="sm">Invite</Button>
  <Button size="default">Invite teammates</Button>
  <Button size="lg">Invite your whole team</Button>
  <Button size="icon" variant="outline" aria-label="Add teammate">
    <Plus />
  </Button>
</div>`,
      },
      {
        name: 'States',
        description:
          'Disabled and loading. Keep the label while loading so the width does not jump.',
        render: `<div className="flex flex-wrap items-center gap-3">
  <Button disabled>Upgrade plan</Button>
  <Button variant="outline" disabled>
    Export
  </Button>
  <Button disabled aria-busy="true">
    <Loader2 className="animate-spin" /> Saving
  </Button>
</div>`,
      },
    ],
  },
]
