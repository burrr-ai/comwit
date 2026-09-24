export const specs = [
  {
    title: 'Editor',
    slug: 'editor',
    covers: ['editor'],
    imports: [{ from: '@comwit/ui-templates/editor', names: ['Editor'] }],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'Rich text editor with a formatting toolbar',
        render: `<div className="w-full max-w-lg">
  <Editor
    placeholder="Write an update for your team"
    value={\`<p>The <strong>v2.4</strong> release ships on Friday. Highlights:</p><ul><li>Faster project search</li><li>Dark theme for the editor</li></ul>\`}
  />
</div>`,
      },
      {
        name: 'ReadOnly',
        description: 'editable={false} hides the toolbar and renders the HTML value',
        render: `<div className="w-full max-w-2xl">
  <Editor
    editable={false}
    value={\`<h2>Scheduled maintenance</h2><p>On <strong>Saturday, 02:00 to 04:00 UTC</strong>, the dashboard will be read-only while we upgrade the database.</p><ul><li>API requests keep working</li><li>Scheduled exports run after the window</li></ul><blockquote>Thanks for your patience.</blockquote>\`}
  />
</div>`,
      },
      {
        name: 'Controlled',
        description: 'value and onChange with React.useState; the HTML output is shown below',
        renderFn: `const [html, setHtml] = React.useState('<p>Try <strong>bold</strong>, lists or a quote.</p>')
return (
  <div className="grid w-full max-w-2xl gap-3">
    <Editor value={html} onChange={setHtml} placeholder="Start writing" />
    <pre className="overflow-x-auto rounded-control border border-border bg-muted p-3 text-caption text-muted-foreground">{html}</pre>
  </div>
)`,
      },
    ],
  },
]
