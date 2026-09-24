export const specs = [
  {
    title: 'Textarea',
    slug: 'textarea',
    covers: ['textarea'],
    component: 'Textarea',
    imports: [
      { from: '@comwit/ui-templates/textarea', names: ['Textarea'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Grows with its content from a four-line minimum',
        render: `<div className="grid w-full max-w-sm gap-2">
  <Label htmlFor="textarea-release-notes">Release notes</Label>
  <Textarea
    id="textarea-release-notes"
    placeholder="What changed in this release?"
    defaultValue="Faster search across projects, plus a new dark theme for the editor."
  />
  <p className="text-caption text-muted-foreground">Shared with everyone in the workspace.</p>
</div>`,
      },
      {
        name: 'Invalid',
        description: 'aria-invalid draws the destructive border',
        render: `<div className="grid w-full max-w-sm gap-2">
  <Label htmlFor="textarea-invalid-bio">Short bio</Label>
  <Textarea
    id="textarea-invalid-bio"
    defaultValue="Hi"
    aria-invalid
    aria-describedby="textarea-invalid-bio-error"
  />
  <p id="textarea-invalid-bio-error" className="text-caption text-destructive">
    Write at least 20 characters.
  </p>
</div>`,
      },
      {
        name: 'Disabled',
        render: `<div className="grid w-full max-w-sm gap-2">
  <Label htmlFor="textarea-disabled-policy">Retention policy</Label>
  <Textarea
    id="textarea-disabled-policy"
    disabled
    defaultValue="Messages are kept for 90 days. Contact an admin to change this."
  />
</div>`,
      },
      {
        name: 'Bare',
        description: 'bare drops the field skin so rows sets the height inside a custom composer',
        render: `<div className="grid w-full max-w-sm gap-2 rounded-card border border-border bg-card p-3">
  <Textarea bare rows={2} placeholder="Write a reply" aria-label="Reply" className="resize-none" />
  <div className="flex justify-end">
    <Button size="sm">Send</Button>
  </div>
</div>`,
      },
    ],
  },
]
