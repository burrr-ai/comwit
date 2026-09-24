export const specs = [
  {
    title: 'Label',
    slug: 'label',
    covers: ['label'],
    component: 'Label',
    docsOnly: true,
    imports: [
      { from: '@comwit/ui-templates/label', names: ['Label'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/checkbox', names: ['Checkbox'] },
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Linked to its control with htmlFor',
        render: `<div className="grid w-full max-w-xs gap-2">
  <Label htmlFor="label-full-name">Full name</Label>
  <Input id="label-full-name" placeholder="Jordan Lee" />
</div>`,
      },
      {
        name: 'WithCheckbox',
        description: 'Clicking the label toggles the checkbox',
        render: `<div className="flex items-center gap-3">
  <Checkbox id="label-remember-device" defaultChecked />
  <Label htmlFor="label-remember-device">Remember this device</Label>
</div>`,
      },
      {
        name: 'Disabled',
        description:
          'A group/field ancestor with data-disabled dims the label; a disabled checkbox or radio before it does too',
        render: `<div className="group/field grid w-full max-w-xs gap-2" data-disabled="true">
  <Label htmlFor="label-api-key">API key</Label>
  <Input id="label-api-key" defaultValue="sk_live_4f9a" disabled />
</div>`,
      },
    ],
  },
]
