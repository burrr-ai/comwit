export const specs = [
  {
    title: 'Sheet',
    slug: 'sheet',
    covers: ['sheet'],
    imports: [
      {
        from: '@comwit/ui-templates/sheet',
        names: [
          'Sheet',
          'SheetTrigger',
          'SheetContent',
          'SheetHeader',
          'SheetFooter',
          'SheetTitle',
          'SheetDescription',
          'SheetClose',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    extraImports: [`import { Copy, Link2, Share2, Trash2 } from 'lucide-react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'A side panel that slides in from the right with a header, body and footer.',
        render: `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Edit workspace</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Workspace settings</SheetTitle>
      <SheetDescription>Changes apply to everyone in this workspace.</SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 px-4">
      <div className="grid gap-2">
        <Label htmlFor="sheet-name">Workspace name</Label>
        <Input id="sheet-name" defaultValue="Acme Design" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sheet-url">Workspace URL</Label>
        <Input id="sheet-url" defaultValue="acme-design" />
      </div>
    </div>
    <SheetFooter>
      <SheetClose asChild>
        <Button>Save changes</Button>
      </SheetClose>
      <SheetClose asChild>
        <Button variant="outline">Cancel</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
      },
      {
        name: 'Sides',
        description: 'side — top · right · bottom · left.',
        render: `<div className="flex flex-wrap items-center gap-3">
  {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
    <Sheet key={side}>
      <SheetTrigger asChild>
        <Button variant="outline" className="capitalize">{side}</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>This panel slides in from the {side} edge.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ))}
</div>`,
      },
      {
        name: 'ActionSheet',
        description: 'A bottom sheet of actions, the mobile-friendly alternative to a menu.',
        render: `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">
      <Share2 />
      Share file
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="mx-auto max-w-lg">
    <SheetHeader>
      <SheetTitle>Q3 roadmap.pdf</SheetTitle>
      <SheetDescription>Shared with 4 people</SheetDescription>
    </SheetHeader>
    <div className="grid gap-2 px-4 pb-4">
      <SheetClose asChild>
        <Button variant="ghost" className="justify-start">
          <Link2 />
          Copy link
        </Button>
      </SheetClose>
      <SheetClose asChild>
        <Button variant="ghost" className="justify-start">
          <Copy />
          Duplicate
        </Button>
      </SheetClose>
      <SheetClose asChild>
        <Button variant="ghost" className="justify-start text-destructive">
          <Trash2 />
          Move to trash
        </Button>
      </SheetClose>
    </div>
  </SheetContent>
</Sheet>`,
      },
    ],
  },
]
