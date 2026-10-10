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
        description: 'Tap or drag — the glass lens refracts icons and stretches with velocity',
        renderFn: `const [tab, setTab] = React.useState('home')
return (
  <div className="w-[min(360px,calc(100vw-32px))] rounded-card bg-muted pt-10">
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
  <div className="w-[min(360px,calc(100vw-32px))] rounded-card bg-muted pt-10">
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
        render: `<div className="w-[min(360px,calc(100vw-32px))] rounded-card bg-muted pt-10">
  <BottomNav value="home" compact>
    <BottomNavItem value="home" label="Home" icon={<House />} />
    <BottomNavItem value="explore" label="Explore" icon={<Compass />} />
    <BottomNavItem value="alerts" label="Notifications" icon={<Bell />} />
    <BottomNavItem value="me" label="Profile" icon={<User />} />
  </BottomNav>
</div>`,
      },
      {
        name: 'LiquidOverContent',
        description:
          'Clear refraction over a colorful background. Press and slide the lens across the icons.',
        renderFn: `const [tab, setTab] = React.useState('home')
return (
  <div className="relative flex h-80 w-[min(360px,calc(100vw-32px))] flex-col justify-end overflow-hidden rounded-card" style={{ background: 'radial-gradient(ellipse at 20% 95%, #38bdf8, transparent 55%), radial-gradient(ellipse at 90% 65%, #fb7185, transparent 55%), linear-gradient(135deg, #ede9fe, #fef3c7)' }}>
    <div className="absolute inset-0 grid grid-cols-6 gap-4 p-4 opacity-40" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => <div key={i} className="rounded-full border border-white" />)}
    </div>
    <div className="relative p-6 text-xl font-semibold text-slate-900">A little liquid.<br />A little light.</div>
    <BottomNav value={tab} onValueChange={setTab} showLabels>
      <BottomNavItem value="home" label="Home" icon={<House />} />
      <BottomNavItem value="explore" label="Explore" icon={<Compass />} />
      <BottomNavItem value="alerts" label="Alerts" icon={<Bell />} />
      <BottomNavItem value="me" label="Profile" icon={<User />} />
    </BottomNav>
  </div>
)`,
      },
      {
        name: 'UncontrolledRTL',
        description:
          'Uncontrolled initial selection, right-to-left geometry, disabled tab, and a real link.',
        render: `<div className="w-[min(360px,calc(100vw-32px))] rounded-card bg-muted pt-10" dir="rtl">
  <BottomNav defaultValue="explore" showLabels>
    <BottomNavItem value="home" label="Home" icon={<House />} />
    <BottomNavItem value="explore" label="Explore" icon={<Compass />} />
    <BottomNavItem value="alerts" label="Alerts" icon={<Bell />} disabled />
    <BottomNavItem value="me" label="Profile" icon={<User />} asChild><a href="#profile" /></BottomNavItem>
  </BottomNav>
</div>`,
      },
    ],
  },
]
