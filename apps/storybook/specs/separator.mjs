export const specs = [
  {
    title: 'Separator',
    slug: 'separator',
    covers: ['separator'],
    docsOnly: true,
    imports: [{ from: '@comwit/ui-templates/separator', names: ['Separator'] }],
    stories: [
      {
        name: 'Showcase',
        gallery: true,
        description: 'A horizontal rule between sections and vertical rules between inline links.',
        render: `<div className="w-72">
  <p className="text-title-sm text-foreground">Comwit UI</p>
  <p className="text-body-sm text-soft-foreground">Headless behavior, styled source you own.</p>
  <Separator className="my-4" />
  <div className="flex h-5 items-center gap-3 text-body-sm text-foreground">
    <span>Docs</span>
    <Separator orientation="vertical" />
    <span>Changelog</span>
    <Separator orientation="vertical" />
    <span>Support</span>
  </div>
</div>`,
      },
      {
        name: 'Horizontal',
        description:
          'Decorative by default. Pass decorative={false} when it separates meaningful groups.',
        render: `<div className="w-full max-w-xs text-body-sm">
  <p className="font-semibold text-foreground">Account</p>
  <p className="text-soft-foreground">Name, email and password</p>
  <Separator decorative={false} className="my-3" />
  <p className="font-semibold text-foreground">Notifications</p>
  <p className="text-soft-foreground">Email and push preferences</p>
</div>`,
      },
      {
        name: 'Vertical',
        description: 'Give the parent a height; the vertical separator fills it.',
        render: `<div className="flex h-5 items-center gap-3 text-body-sm text-soft-foreground">
  <span>Updated 2 hours ago</span>
  <Separator orientation="vertical" />
  <span>4 contributors</span>
  <Separator orientation="vertical" />
  <span>MIT license</span>
</div>`,
      },
    ],
  },
]
