export const specs = [
  {
    title: 'TextField',
    slug: 'text-field',
    covers: ['text-field'],
    imports: [
      { from: '@comwit/ui-templates/text-field', names: ['TextField'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/textarea', names: ['Textarea'] },
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Label, helper text and error wired to the control',
        render: `<div className="grid w-full max-w-xs gap-4">
  <TextField label="Display name" helperText="Shown on comments and mentions.">
    <Input defaultValue="Jordan Lee" />
  </TextField>
  <TextField label="Work email" required error="Use your company email address.">
    <Input type="email" defaultValue="jordan@gmail.com" />
  </TextField>
</div>`,
      },
      {
        name: 'Invalid',
        description: 'error replaces the helper text; invalid marks the field without a message',
        render: `<div className="grid w-full max-w-xs gap-4">
  <TextField label="Password" helperText="At least 12 characters." error="Password is too short.">
    <Input type="password" defaultValue="hunter2" />
  </TextField>
  <TextField label="Invite code" invalid helperText="Codes are case sensitive.">
    <Input defaultValue="WELCOME-2024" />
  </TextField>
</div>`,
      },
      {
        name: 'Disabled',
        render: `<TextField label="Workspace ID" disabled helperText="Assigned when the workspace is created." className="max-w-xs">
  <Input defaultValue="ws_8f2k1c" />
</TextField>`,
      },
      {
        name: 'WithTextarea',
        description: 'Any Input or Textarea works as the control',
        render: `<TextField label="Project description" required helperText="Up to 280 characters." className="max-w-sm">
  <Textarea placeholder="What is this project about?" />
</TextField>`,
      },
    ],
  },
]
