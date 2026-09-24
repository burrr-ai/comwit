export const specs = [
  {
    title: 'Select',
    slug: 'select',
    covers: ['select'],
    imports: [
      {
        from: '@comwit/ui-templates/select',
        names: [
          'Select',
          'SelectTrigger',
          'SelectValue',
          'SelectContent',
          'SelectItem',
          'SelectGroup',
          'SelectLabel',
          'SelectSeparator',
        ],
      },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Labelled triggers with a selected value',
        render: `<div className="grid w-full max-w-md grid-cols-2 gap-4">
  <div className="grid gap-2">
    <Label htmlFor="select-plan">Plan</Label>
    <Select defaultValue="pro">
      <SelectTrigger id="select-plan" className="w-full">
        <SelectValue placeholder="Choose a plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free</SelectItem>
        <SelectItem value="pro">Pro</SelectItem>
        <SelectItem value="team">Team</SelectItem>
        <SelectItem value="enterprise">Enterprise</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="grid gap-2">
    <Label htmlFor="select-billing">Billing cycle</Label>
    <Select>
      <SelectTrigger id="select-billing" className="w-full">
        <SelectValue placeholder="Choose a cycle" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="yearly">Yearly</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>`,
      },
      {
        name: 'Grouped',
        description: 'SelectGroup, SelectLabel and SelectSeparator',
        render: `<Select defaultValue="europe-berlin">
  <SelectTrigger className="w-64" aria-label="Time zone">
    <SelectValue placeholder="Choose a time zone" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Americas</SelectLabel>
      <SelectItem value="america-new-york">New York (GMT-5)</SelectItem>
      <SelectItem value="america-chicago">Chicago (GMT-6)</SelectItem>
      <SelectItem value="america-los-angeles">Los Angeles (GMT-8)</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Europe</SelectLabel>
      <SelectItem value="europe-london">London (GMT+0)</SelectItem>
      <SelectItem value="europe-berlin">Berlin (GMT+1)</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Asia</SelectLabel>
      <SelectItem value="asia-seoul">Seoul (GMT+9)</SelectItem>
      <SelectItem value="asia-tokyo">Tokyo (GMT+9)</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
      },
      {
        name: 'States',
        description: 'Small trigger, disabled trigger, invalid trigger and a disabled option',
        render: `<div className="flex flex-wrap items-start gap-3">
  <Select defaultValue="viewer">
    <SelectTrigger size="sm" className="w-40" aria-label="Role">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="viewer">Viewer</SelectItem>
      <SelectItem value="editor">Editor</SelectItem>
      <SelectItem value="owner" disabled>Owner</SelectItem>
    </SelectContent>
  </Select>
  <Select disabled defaultValue="us-east">
    <SelectTrigger className="w-40" aria-label="Region">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="us-east">US East</SelectItem>
      <SelectItem value="eu-west">EU West</SelectItem>
    </SelectContent>
  </Select>
  <Select>
    <SelectTrigger aria-invalid className="w-40" aria-label="Country">
      <SelectValue placeholder="Country" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="us">United States</SelectItem>
      <SelectItem value="gb">United Kingdom</SelectItem>
      <SelectItem value="kr">South Korea</SelectItem>
    </SelectContent>
  </Select>
</div>`,
      },
      {
        name: 'Controlled',
        description: 'value and onValueChange',
        renderFn: `const [sort, setSort] = React.useState('recent')
return (
  <div className="grid w-full max-w-xs gap-3">
    <Select value={sort} onValueChange={setSort}>
      <SelectTrigger className="w-full" aria-label="Sort by">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Recently updated</SelectItem>
        <SelectItem value="name">Name</SelectItem>
        <SelectItem value="owner">Owner</SelectItem>
      </SelectContent>
    </Select>
    <p className="text-caption text-muted-foreground">Sorting by: {sort}</p>
  </div>
)`,
      },
    ],
  },
]
