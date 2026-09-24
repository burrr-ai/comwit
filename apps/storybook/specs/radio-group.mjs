export const specs = [
  {
    title: 'RadioGroup',
    slug: 'radio-group',
    covers: ['radio-group'],
    imports: [
      { from: '@comwit/ui-templates/radio-group', names: ['RadioGroup', 'RadioGroupItem'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Choose a plan, with supporting text for each option',
        render: `<RadioGroup defaultValue="pro" aria-label="Plan" className="w-full max-w-sm gap-4">
  {[
    { value: 'free', label: 'Free', hint: 'Up to 3 projects for personal use.' },
    { value: 'pro', label: 'Pro', hint: 'Unlimited projects and version history.' },
    { value: 'team', label: 'Team', hint: 'Shared workspaces and admin controls.' },
  ].map((plan) => (
    <div key={plan.value} className="flex items-start gap-3">
      <RadioGroupItem value={plan.value} id={\`radio-plan-\${plan.value}\`} />
      <div className="grid gap-1">
        <Label htmlFor={\`radio-plan-\${plan.value}\`}>{plan.label}</Label>
        <p className="text-caption text-muted-foreground">{plan.hint}</p>
      </div>
    </div>
  ))}
</RadioGroup>`,
      },
      {
        name: 'Horizontal',
        description: 'orientation="horizontal" for short option lists',
        render: `<RadioGroup defaultValue="monthly" orientation="horizontal" aria-label="Billing cycle" className="flex flex-wrap gap-6">
  <div className="flex items-center gap-3">
    <RadioGroupItem value="monthly" id="radio-billing-monthly" />
    <Label htmlFor="radio-billing-monthly">Monthly</Label>
  </div>
  <div className="flex items-center gap-3">
    <RadioGroupItem value="yearly" id="radio-billing-yearly" />
    <Label htmlFor="radio-billing-yearly">Yearly</Label>
  </div>
</RadioGroup>`,
      },
      {
        name: 'Disabled',
        description: 'A single disabled option, and a fully disabled group',
        render: `<div className="grid gap-8">
  <RadioGroup defaultValue="standard" aria-label="Shipping speed">
    <div className="flex items-center gap-3">
      <RadioGroupItem value="standard" id="radio-shipping-standard" />
      <Label htmlFor="radio-shipping-standard">Standard (3 to 5 days)</Label>
    </div>
    <div className="flex items-center gap-3">
      <RadioGroupItem value="overnight" id="radio-shipping-overnight" disabled />
      <Label htmlFor="radio-shipping-overnight">Overnight (unavailable in your region)</Label>
    </div>
  </RadioGroup>
  <div>
    <RadioGroup defaultValue="private" disabled aria-label="Visibility">
      <div className="flex items-center gap-3">
        <RadioGroupItem value="private" id="radio-visibility-private" />
        <Label htmlFor="radio-visibility-private">Private</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="public" id="radio-visibility-public" />
        <Label htmlFor="radio-visibility-public">Public</Label>
      </div>
    </RadioGroup>
  </div>
</div>`,
      },
      {
        name: 'Controlled',
        description: 'value and onValueChange',
        renderFn: `const [theme, setTheme] = React.useState('system')
return (
  <div className="grid gap-4">
    <RadioGroup value={theme} onValueChange={setTheme} aria-label="Theme">
      {['light', 'dark', 'system'].map((option) => (
        <div key={option} className="flex items-center gap-3">
          <RadioGroupItem value={option} id={\`radio-theme-\${option}\`} />
          <Label htmlFor={\`radio-theme-\${option}\`} className="capitalize">{option}</Label>
        </div>
      ))}
    </RadioGroup>
    <p className="text-caption text-muted-foreground">Theme: {theme}</p>
  </div>
)`,
      },
    ],
  },
]
