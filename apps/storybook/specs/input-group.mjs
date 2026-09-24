export const specs = [
  {
    title: 'InputGroup',
    slug: 'input-group',
    covers: ['input-group'],
    imports: [
      { from: '@comwit/ui-templates/input-group', names: ['InputGroup', 'InputAddon'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [`import { Search } from 'lucide-react'`],
    stories: [
      {
        name: 'Addons',
        gallery: true,
        description: 'Icon and text addons share one focus ring with the input',
        render: `<div className="grid w-full max-w-xs gap-3">
  <InputGroup>
    <InputAddon><Search /></InputAddon>
    <Input placeholder="Search projects" aria-label="Search projects" />
  </InputGroup>
  <InputGroup>
    <InputAddon className="pr-0">comwit.io/</InputAddon>
    <Input defaultValue="acme-design" aria-label="Workspace URL" />
  </InputGroup>
</div>`,
      },
      {
        name: 'Units',
        description: 'Prefix and suffix units around a numeric value',
        render: `<div className="grid w-full max-w-xs gap-3">
  <InputGroup>
    <InputAddon>$</InputAddon>
    <Input inputMode="decimal" placeholder="0.00" aria-label="Monthly budget" />
    <InputAddon>USD</InputAddon>
  </InputGroup>
  <InputGroup>
    <Input inputMode="numeric" defaultValue="25" aria-label="Seats" />
    <InputAddon>seats</InputAddon>
  </InputGroup>
</div>`,
      },
      {
        name: 'TrailingButton',
        description: 'A compact button inside the group',
        render: `<InputGroup className="w-full max-w-sm pr-1">
  <Input type="email" placeholder="teammate@company.com" aria-label="Invite by email" />
  <InputAddon className="px-0">
    <Button size="sm">Invite</Button>
  </InputAddon>
</InputGroup>`,
      },
      {
        name: 'States',
        description: 'The group follows the inner input: aria-invalid and disabled',
        render: `<div className="grid w-full max-w-xs gap-3">
  <InputGroup>
    <InputAddon>$</InputAddon>
    <Input inputMode="decimal" defaultValue="-40" aria-invalid aria-label="Refund amount" />
  </InputGroup>
  <InputGroup>
    <InputAddon><Search /></InputAddon>
    <Input placeholder="Search is unavailable" disabled aria-label="Search" />
  </InputGroup>
</div>`,
      },
    ],
  },
]
