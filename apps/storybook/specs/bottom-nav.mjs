export const specs = [
  {
    title: 'BottomNav',
    slug: 'bottom-nav',
    covers: ['bottom-nav'],
    imports: [{ from: '@comwit/ui-templates/bottom-nav', names: ['BottomNav', 'BottomNavItem'] }],
    extraImports: [
      `import * as React from 'react'`,
      `import { House, Compass, Bell, User } from 'lucide-react'`,
    ],
    stories: [
      {
        name: 'Floating',
        gallery: true,
        description: 'Tap a tab — the indicator springs across and squashes',
        renderFn: `const [tab, setTab] = React.useState('home')
return (
  <div className="w-full max-w-sm rounded-card bg-muted pt-10">
    <BottomNav value={tab} onValueChange={setTab}>
      <BottomNavItem value="home" label="Home" icon={<House />} />
      <BottomNavItem value="explore" label="Explore" icon={<Compass />} />
      <BottomNavItem value="alerts" label="Notifications" icon={<Bell />} />
      <BottomNavItem value="me" label="Profile" icon={<User />} />
    </BottomNav>
  </div>
)`,
      },
      {
        name: 'WithLabels',
        description: 'showLabels — small captions under each icon',
        renderFn: `const [tab, setTab] = React.useState('explore')
return (
  <div className="w-full max-w-sm rounded-card bg-muted pt-10">
    <BottomNav value={tab} onValueChange={setTab} showLabels>
      <BottomNavItem value="home" label="Home" icon={<House />} />
      <BottomNavItem value="explore" label="Explore" icon={<Compass />} />
      <BottomNavItem value="me" label="Profile" icon={<User />} />
    </BottomNav>
  </div>
)`,
      },
      {
        name: 'Compact',
        description: 'compact — the scrolled-down state',
        render: `<div className="w-full max-w-sm rounded-card bg-muted pt-10">
  <BottomNav value="home" compact>
    <BottomNavItem value="home" label="Home" icon={<House />} />
    <BottomNavItem value="explore" label="Explore" icon={<Compass />} />
    <BottomNavItem value="alerts" label="Notifications" icon={<Bell />} />
    <BottomNavItem value="me" label="Profile" icon={<User />} />
  </BottomNav>
</div>`,
      },
    ],
  },
]
