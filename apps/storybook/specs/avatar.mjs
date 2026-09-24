// Image avatars use inline data URIs because the static Storybook build blocks external URLs.
const photo = (initials, bg) =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23${bg}'/><text x='40' y='50' font-size='28' font-weight='600' fill='%23ffffff' text-anchor='middle' font-family='sans-serif'>${initials}</text></svg>`

export const specs = [
  {
    title: 'Avatar',
    slug: 'avatar',
    covers: ['avatar'],
    // Compound component (Avatar / AvatarImage / AvatarFallback), so meta.component is omitted.
    imports: [
      {
        from: '@comwit/ui-templates/avatar',
        names: ['Avatar', 'AvatarImage', 'AvatarFallback'],
      },
    ],
    stories: [
      {
        name: 'Team',
        gallery: true,
        description: 'A profile row and an overlapping group with an overflow count.',
        render: `<div className="flex flex-col items-center gap-6">
  <div className="flex items-center gap-3">
    <Avatar className="size-12">
      <AvatarImage src="${photo('AC', '3b5bdb')}" alt="Ava Chen" />
      <AvatarFallback>AC</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-body font-semibold text-foreground">Ava Chen</p>
      <p className="text-body-sm text-soft-foreground">Product designer · Online</p>
    </div>
  </div>
  <div className="flex items-center gap-3">
    <div className="flex -space-x-2">
      {['LP', 'SR', 'NK', 'MJ'].map((initials) => (
        <Avatar key={initials} className="size-9 ring-2 ring-background">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
      <Avatar className="size-9 ring-2 ring-background">
        <AvatarFallback className="bg-primary-surface text-primary">+3</AvatarFallback>
      </Avatar>
    </div>
    <span className="text-body-sm text-soft-foreground">7 people are editing</span>
  </div>
</div>`,
      },
      {
        name: 'ImageAndFallback',
        description:
          'AvatarImage renders once it loads; AvatarFallback shows the initials until then or if it fails.',
        render: `<div className="flex items-center gap-4">
  <Avatar className="size-10">
    <AvatarImage src="${photo('LP', '2f9e44')}" alt="Liam Patel" />
    <AvatarFallback>LP</AvatarFallback>
  </Avatar>
  <Avatar className="size-10">
    <AvatarFallback>SR</AvatarFallback>
  </Avatar>
</div>`,
      },
      {
        name: 'Sizes',
        description: 'There is no size prop. Set the size with a size-* utility (default size-8).',
        render: `<div className="flex items-center gap-4">
  {(['size-6', 'size-8', 'size-10', 'size-12', 'size-16'] as const).map((size) => (
    <Avatar key={size} className={size}>
      <AvatarFallback>NK</AvatarFallback>
    </Avatar>
  ))}
</div>`,
      },
    ],
  },
]
