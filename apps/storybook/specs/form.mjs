export const specs = [
  {
    title: 'Form',
    slug: 'form',
    covers: ['form'],
    imports: [
      {
        from: '@comwit/ui-templates/form',
        names: [
          'Form',
          'FormField',
          'FormItem',
          'FormLabel',
          'FormControl',
          'FormDescription',
          'FormMessage',
        ],
      },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
      {
        from: '@comwit/ui-templates/select',
        names: ['Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem'],
      },
      { from: '@comwit/ui-templates/switch', names: ['Switch'] },
    ],
    extraImports: [`import * as React from 'react'`, `import { useForm } from 'react-hook-form'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description:
          'FormField connects a react-hook-form field to its label, control and messages',
        renderFn: `const form = useForm({ defaultValues: { workspace: 'Acme Design' } })
return (
  <Form {...form}>
    <form className="grid w-full max-w-sm gap-4" onSubmit={form.handleSubmit(() => {})}>
      <FormField
        control={form.control}
        name="workspace"
        rules={{ required: 'Enter a workspace name.' }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Workspace name</FormLabel>
            <FormControl>
              <Input placeholder="Acme Design" {...field} />
            </FormControl>
            <FormDescription>Shown in invites and on the sidebar.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" className="w-fit">Save changes</Button>
    </form>
  </Form>
)`,
      },
      {
        name: 'Validation',
        description:
          'Submit to see rule messages in FormMessage; a valid submit shows a confirmation',
        renderFn: `const form = useForm({ defaultValues: { email: '' } })
const [invited, setInvited] = React.useState<string | null>(null)
return (
  <Form {...form}>
    <form
      className="grid w-full max-w-sm gap-4"
      onSubmit={form.handleSubmit((values) => setInvited(values.email))}
    >
      <FormField
        control={form.control}
        name="email"
        rules={{
          required: 'Enter an email address.',
          pattern: { value: /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/, message: 'Enter a valid email address.' },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Invite a teammate</FormLabel>
            <FormControl>
              <Input type="email" placeholder="teammate@company.com" {...field} />
            </FormControl>
            <FormDescription>They will get an email with a link to join.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit" className="w-fit">Send invite</Button>
      {invited ? (
        <p className="text-caption text-muted-foreground">Invite sent to {invited}.</p>
      ) : null}
    </form>
  </Form>
)`,
      },
      {
        name: 'OtherControls',
        description: 'FormControl also wraps a SelectTrigger or a Switch',
        renderFn: `const form = useForm({ defaultValues: { role: 'editor', notify: true } })
return (
  <Form {...form}>
    <form className="grid w-full max-w-sm gap-6" onSubmit={form.handleSubmit(() => {})}>
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default role</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>Applied to everyone who joins with an invite link.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="notify"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-6">
            <div className="grid gap-1">
              <FormLabel>Notify admins</FormLabel>
              <FormDescription>Email admins when someone joins.</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <Button type="submit" className="w-fit">Save settings</Button>
    </form>
  </Form>
)`,
      },
    ],
  },
]
