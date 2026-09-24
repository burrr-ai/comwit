export const specs = [
  {
    title: 'DropdownMenu',
    slug: 'dropdown-menu',
    covers: ['dropdown-menu'],
    imports: [
      {
        from: '@comwit/ui-templates/dropdown-menu',
        names: [
          'DropdownMenu',
          'DropdownMenuTrigger',
          'DropdownMenuContent',
          'DropdownMenuGroup',
          'DropdownMenuLabel',
          'DropdownMenuItem',
          'DropdownMenuCheckboxItem',
          'DropdownMenuRadioGroup',
          'DropdownMenuRadioItem',
          'DropdownMenuSeparator',
          'DropdownMenuShortcut',
          'DropdownMenuSub',
          'DropdownMenuSubTrigger',
          'DropdownMenuSubContent',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [
      `import * as React from 'react'`,
      `import { ArrowUpDown, Copy, CreditCard, LogOut, Mail, MessageSquare, MoreHorizontal, Pencil, Settings, Share2, SlidersHorizontal, Trash2, User } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description:
          'An account menu on refractive glass: label, grouped items with shortcuts, and a destructive item.',
        render: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <User />
      My account
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuLabel>jordan@acme.com</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <User />
        Profile
        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <CreditCard />
        Billing
        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings />
        Settings
        <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      <LogOut />
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      },
      {
        name: 'CheckboxItems',
        description: 'DropdownMenuCheckboxItem toggles independent options.',
        renderFn: `const [columns, setColumns] = React.useState({ owner: true, status: true, updated: false })
const toggle = (key: keyof typeof columns) => (checked: boolean) =>
  setColumns((prev) => ({ ...prev, [key]: checked }))
return (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        <SlidersHorizontal />
        Columns
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-52">
      <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked disabled>
        Name
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={columns.owner} onCheckedChange={toggle('owner')}>
        Owner
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={columns.status} onCheckedChange={toggle('status')}>
        Status
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={columns.updated} onCheckedChange={toggle('updated')}>
        Last updated
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
)`,
      },
      {
        name: 'RadioGroup',
        description: 'DropdownMenuRadioGroup picks exactly one option.',
        renderFn: `const [sort, setSort] = React.useState('newest')
const labels: Record<string, string> = { newest: 'Newest first', oldest: 'Oldest first', name: 'Name (A–Z)' }
return (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        <ArrowUpDown />
        {labels[sort]}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-52">
      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
        <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="name">Name (A–Z)</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)`,
      },
      {
        name: 'Submenu',
        description:
          'DropdownMenuSub nests a second-level menu, here from an icon-only row action.',
        render: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="More actions">
      <MoreHorizontal />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-52" align="end">
    <DropdownMenuItem>
      <Pencil />
      Rename
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Copy />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Share2 className="mr-2 size-4 text-muted-foreground" />
        Share
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-44">
        <DropdownMenuItem>
          <Mail />
          Email link
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MessageSquare />
          Send to Slack
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      <Trash2 />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      },
    ],
  },
]
