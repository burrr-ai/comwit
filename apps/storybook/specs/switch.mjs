export const specs = [
  {
    title: 'Switch',
    covers: ['switch'],
    component: 'Switch',
    imports: [
      { from: '@comwit/ui-templates/switch', names: ['Switch'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Settings rows with a label, supporting text and a switch',
        render: `<div className="grid w-full max-w-sm gap-4">
  <div className="flex items-center justify-between gap-6">
    <div className="grid gap-1">
      <Label htmlFor="switch-email">Email notifications</Label>
      <p className="text-caption text-muted-foreground">Mentions, replies and assignments.</p>
    </div>
    <Switch id="switch-email" defaultChecked />
  </div>
  <div className="flex items-center justify-between gap-6">
    <div className="grid gap-1">
      <Label htmlFor="switch-push">Push notifications</Label>
      <p className="text-caption text-muted-foreground">Alerts on your phone and desktop.</p>
    </div>
    <Switch id="switch-push" />
  </div>
  <div className="flex items-center justify-between gap-6">
    <div className="grid gap-1">
      <Label htmlFor="switch-digest">Weekly digest</Label>
      <p className="text-caption text-muted-foreground">A Monday summary of project activity.</p>
    </div>
    <Switch id="switch-digest" defaultChecked />
  </div>
</div>`,
      },
      {
        name: 'Sizes',
        description: 'size — default and sm',
        render: `<div className="grid gap-4">
  <div className="flex items-center gap-3">
    <Switch id="switch-size-default" defaultChecked />
    <Label htmlFor="switch-size-default">Auto-save drafts</Label>
  </div>
  <div className="flex items-center gap-3">
    <Switch id="switch-size-sm" size="sm" defaultChecked />
    <Label htmlFor="switch-size-sm">Compact mode</Label>
  </div>
</div>`,
      },
      {
        name: 'Disabled',
        description: 'Disabled off and on; className="peer" lets the following Label dim with it',
        render: `<div className="grid gap-4">
  <div className="flex items-center gap-3">
    <Switch id="switch-disabled-off" className="peer" disabled />
    <Label htmlFor="switch-disabled-off">Single sign-on</Label>
  </div>
  <div className="flex items-center gap-3">
    <Switch id="switch-disabled-on" className="peer" disabled defaultChecked />
    <Label htmlFor="switch-disabled-on">Two-factor authentication</Label>
  </div>
</div>`,
      },
      {
        name: 'Controlled',
        description: 'checked and onCheckedChange',
        renderFn: `const [maintenance, setMaintenance] = React.useState(false)
return (
  <div className="grid w-full max-w-sm gap-2">
    <div className="flex items-center justify-between gap-6">
      <Label htmlFor="switch-maintenance">Maintenance mode</Label>
      <Switch id="switch-maintenance" checked={maintenance} onCheckedChange={setMaintenance} />
    </div>
    <p className="text-caption text-muted-foreground">
      {maintenance ? 'Visitors see a maintenance page.' : 'Your site is live.'}
    </p>
  </div>
)`,
      },
    ],
  },
]
