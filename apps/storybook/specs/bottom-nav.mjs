export const specs = [
  {
    title: 'BottomNav',
    slug: 'bottom-nav',
    covers: ['bottom-nav'],
    imports: [{ from: '@comwit/ui-templates/bottom-nav', names: ['BottomNav', 'BottomNavItem'] }],
    extraImports: [
      `import * as React from 'react'`,
      `import { HouseIcon, CompassIcon, BellIcon, UserRoundIcon } from '@comwit/ui/icons'`,
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
      <BottomNavItem value="home" label="Home" icon={<HouseIcon />} />
      <BottomNavItem value="explore" label="Explore" icon={<CompassIcon />} />
      <BottomNavItem value="alerts" label="Notifications" icon={<BellIcon />} />
      <BottomNavItem value="me" label="Profile" icon={<UserRoundIcon />} />
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
      <BottomNavItem value="home" label="Home" icon={<HouseIcon />} />
      <BottomNavItem value="explore" label="Explore" icon={<CompassIcon />} />
      <BottomNavItem value="me" label="Profile" icon={<UserRoundIcon />} />
    </BottomNav>
  </div>
)`,
      },
      {
        name: 'Compact',
        description: 'compact — the scrolled-down state',
        render: `<div className="w-full max-w-sm rounded-card bg-muted pt-10">
  <BottomNav value="home" compact>
    <BottomNavItem value="home" label="Home" icon={<HouseIcon />} />
    <BottomNavItem value="explore" label="Explore" icon={<CompassIcon />} />
    <BottomNavItem value="alerts" label="Notifications" icon={<BellIcon />} />
    <BottomNavItem value="me" label="Profile" icon={<UserRoundIcon />} />
  </BottomNav>
</div>`,
      },
    ],
  },
]
