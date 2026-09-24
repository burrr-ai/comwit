export const specs = [
  {
    title: 'Switch',
    covers: ['switch'],
    component: 'Switch',
    imports: [{ from: '@comwit/ui-templates/switch', names: ['Switch'] }],
    stories: [
      {
        name: 'Sizes',
        render: `<div className="flex items-center gap-6">
  <Switch defaultChecked />
  <Switch size="sm" defaultChecked />
  <Switch disabled defaultChecked />
</div>`,
      },
    ],
  },
]
