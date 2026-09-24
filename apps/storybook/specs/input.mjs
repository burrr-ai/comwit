export const specs = [
  {
    title: 'Input',
    slug: 'input',
    covers: ['input'],
    component: 'Input',
    imports: [
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    extraImports: [`import { Search } from 'lucide-react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Labelled inputs, filled and empty',
        render: `<div className="grid w-full max-w-xs gap-4">
  <div className="grid gap-2">
    <Label htmlFor="input-workspace-name">Workspace name</Label>
    <Input id="input-workspace-name" defaultValue="Acme Design" />
  </div>
  <div className="grid gap-2">
    <Label htmlFor="input-workspace-url">Workspace URL</Label>
    <Input id="input-workspace-url" placeholder="acme-design" />
  </div>
</div>`,
      },
      {
        name: 'Types',
        description: 'Native input types: email, password, number and file',
        render: `<div className="grid w-full max-w-xs gap-3">
  <Input type="email" placeholder="you@company.com" aria-label="Email" />
  <Input type="password" defaultValue="correct-horse" aria-label="Password" />
  <Input type="number" defaultValue={12} min={1} aria-label="Seats" />
  <Input type="file" aria-label="Logo" />
</div>`,
      },
      {
        name: 'States',
        description: 'aria-invalid draws the destructive border; disabled dims and blocks input',
        render: `<div className="grid w-full max-w-xs gap-4">
  <div className="grid gap-2">
    <Label htmlFor="input-invalid-email">Billing email</Label>
    <Input
      id="input-invalid-email"
      type="email"
      defaultValue="finance@acme"
      aria-invalid
      aria-describedby="input-invalid-email-error"
    />
    <p id="input-invalid-email-error" className="text-caption text-destructive">
      Enter a complete email address.
    </p>
  </div>
  <div className="grid gap-2">
    <Label htmlFor="input-disabled-id">Workspace ID</Label>
    <Input id="input-disabled-id" defaultValue="ws_8f2k1c" disabled />
  </div>
</div>`,
      },
      {
        name: 'Bare',
        description:
          'bare drops the field skin so the input can sit inside an already styled container',
        render: `<div className="flex w-full max-w-sm items-center gap-2 rounded-pill border border-border bg-muted px-4 py-2">
  <Search className="size-4 shrink-0 text-muted-foreground" />
  <Input bare placeholder="Search docs" aria-label="Search docs" />
</div>`,
      },
    ],
  },
]
