export const specs = [
  {
    title: 'Dialog',
    slug: 'dialog',
    covers: ['dialog'],
    imports: [
      {
        from: '@comwit/ui-templates/dialog',
        names: [
          'Dialog',
          'DialogTrigger',
          'DialogContent',
          'DialogHeader',
          'DialogTitle',
          'DialogDescription',
          'DialogFooter',
          'DialogClose',
        ],
      },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
      { from: '@comwit/ui-templates/input', names: ['Input'] },
      { from: '@comwit/ui-templates/label', names: ['Label'] },
    ],
    extraImports: [`import * as React from 'react'`],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'A trigger button opens a modal form with a footer of actions.',
        render: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Update how your name and username appear to teammates.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="dialog-name">Name</Label>
        <Input id="dialog-name" defaultValue="Jordan Lee" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dialog-username">Username</Label>
        <Input id="dialog-username" defaultValue="@jordan" />
      </div>
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button>Save changes</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
      },
      {
        name: 'Destructive',
        description: 'Confirm an irreversible action with a destructive primary button.',
        render: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete project</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete project?</DialogTitle>
      <DialogDescription>
        This permanently removes "Marketing site" along with its deployments and environment variables. This can't be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button variant="destructive">Delete project</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
      },
      {
        name: 'Controlled',
        description: 'open / onOpenChange — close the dialog from your own submit handler.',
        renderFn: `const [open, setOpen] = React.useState(false)
const [email, setEmail] = React.useState('')
const [invited, setInvited] = React.useState<string[]>([])
return (
  <div className="flex flex-col items-center gap-3">
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite teammates</Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!email) return
            setInvited((list) => [...list, email])
            setEmail('')
            setOpen(false)
          }}
        >
          <DialogHeader>
            <DialogTitle>Invite teammates</DialogTitle>
            <DialogDescription>
              They'll get an email with a link to join your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="dialog-invite">Email address</Label>
            <Input
              id="dialog-invite"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!email}>Send invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <p className="text-caption text-muted-foreground">
      {invited.length ? 'Invited: ' + invited.join(', ') : 'No invites sent yet'}
    </p>
  </div>
)`,
      },
      {
        name: 'WithoutCloseButton',
        description:
          'showCloseButton={false} hides the top-right close icon when an explicit choice is required.',
        render: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="secondary">Review terms</Button>
  </DialogTrigger>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>Updated terms of service</DialogTitle>
      <DialogDescription>
        We've updated how we handle data exports. Please accept the new terms to keep using your workspace.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button className="w-full">Accept and continue</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
      },
    ],
  },
]
