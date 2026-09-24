export const specs = [
  {
    title: 'Checkbox',
    slug: 'checkbox',
    covers: ['checkbox'],
    component: 'Checkbox',
    imports: [
      { from: '@comwit/ui-templates/checkbox', names: ['Checkbox'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Checkboxes with labels and supporting text',
        render: `<div className="grid w-full max-w-sm gap-4">
  <div className="flex items-start gap-3">
    <Checkbox id="checkbox-product-updates" defaultChecked />
    <div className="grid gap-1">
      <Label htmlFor="checkbox-product-updates">Product updates</Label>
      <p className="text-caption text-muted-foreground">New features and improvements, once a month.</p>
    </div>
  </div>
  <div className="flex items-start gap-3">
    <Checkbox id="checkbox-weekly-digest" />
    <div className="grid gap-1">
      <Label htmlFor="checkbox-weekly-digest">Weekly digest</Label>
      <p className="text-caption text-muted-foreground">A summary of activity in your projects.</p>
    </div>
  </div>
  <div className="flex items-start gap-3">
    <Checkbox id="checkbox-security-alerts" defaultChecked />
    <div className="grid gap-1">
      <Label htmlFor="checkbox-security-alerts">Security alerts</Label>
      <p className="text-caption text-muted-foreground">Sign-ins from new devices and password changes.</p>
    </div>
  </div>
</div>`,
      },
      {
        name: 'States',
        description: 'Unchecked, checked, disabled, and disabled while checked',
        render: `<div className="grid gap-4">
  <div className="flex items-center gap-3">
    <Checkbox id="checkbox-state-unchecked" />
    <Label htmlFor="checkbox-state-unchecked">Show archived projects</Label>
  </div>
  <div className="flex items-center gap-3">
    <Checkbox id="checkbox-state-checked" defaultChecked />
    <Label htmlFor="checkbox-state-checked">Show completed tasks</Label>
  </div>
  <div className="flex items-center gap-3">
    <Checkbox id="checkbox-state-disabled" disabled />
    <Label htmlFor="checkbox-state-disabled">Sync with calendar</Label>
  </div>
  <div className="flex items-center gap-3">
    <Checkbox id="checkbox-state-disabled-checked" disabled defaultChecked />
    <Label htmlFor="checkbox-state-disabled-checked">Required by your admin</Label>
  </div>
</div>`,
      },
      {
        name: 'Controlled',
        description: 'checked and onCheckedChange gate the submit button',
        renderFn: `const [accepted, setAccepted] = React.useState(false)
return (
  <div className="grid w-full max-w-sm gap-4">
    <div className="flex items-center gap-3">
      <Checkbox id="checkbox-accept-terms" checked={accepted} onCheckedChange={setAccepted} />
      <Label htmlFor="checkbox-accept-terms">I agree to the terms of service</Label>
    </div>
    <Button disabled={!accepted} className="w-fit">Create account</Button>
  </div>
)`,
      },
    ],
  },
]
