export const specs = [
  {
    title: 'Toast',
    slug: 'toast',
    covers: ['toast'],
    // The Toaster is already mounted globally (Storybook preview decorator / docs providers),
    // so these stories only call toast() from a button. toast() renders the glass <Toast>
    // through sonner; calling sonner's own toast() would show its default skin instead.
    imports: [
      { from: '@comwit/ui-templates/toast', names: ['toast'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    stories: [
      {
        name: 'Default',
        gallery: true,
        description: 'A glass toast with a status icon, title and supporting description.',
        render: `<Button
  onClick={() =>
    toast.success('Changes saved', {
      description: 'Your workspace settings were updated just now.',
    })
  }
>
  Save changes
</Button>`,
      },
      {
        name: 'Types',
        description: 'toast · success · error · warning · info · loading.',
        render: `<div className="flex flex-wrap items-center justify-center gap-3">
  <Button variant="outline" onClick={() => toast('Draft saved to your library')}>
    Default
  </Button>
  <Button variant="outline" onClick={() => toast.success('Payment received')}>
    Success
  </Button>
  <Button
    variant="outline"
    onClick={() =>
      toast.error("Couldn't upload file", { description: 'Files must be smaller than 25 MB.' })
    }
  >
    Error
  </Button>
  <Button
    variant="outline"
    onClick={() =>
      toast.warning('Storage almost full', { description: "You've used 92% of your 10 GB plan." })
    }
  >
    Warning
  </Button>
  <Button variant="outline" onClick={() => toast.info('A new version is available')}>
    Info
  </Button>
  <Button
    variant="outline"
    onClick={() => {
      const id = toast.loading('Exporting report…')
      setTimeout(() => toast.success('Report exported', { id }), 2000)
    }}
  >
    Loading
  </Button>
</div>`,
      },
      {
        name: 'PromiseToast',
        description: 'toast.promise moves one toast through loading → success / error.',
        render: `<div className="flex flex-wrap items-center justify-center gap-3">
  <Button
    variant="outline"
    onClick={() =>
      toast.promise(
        new Promise<{ name: string }>((resolve) =>
          setTimeout(() => resolve({ name: 'Q3 launch' }), 1800)
        ),
        {
          loading: 'Publishing project…',
          success: (project) => project.name + ' is live',
          error: "Couldn't publish project",
        }
      )
    }
  >
    Publish project
  </Button>
  <Button
    variant="outline"
    onClick={() =>
      toast.promise(
        new Promise((_, reject) => setTimeout(() => reject(new Error('Network error')), 1800)),
        {
          loading: 'Syncing calendar…',
          success: 'Calendar synced',
          error: "Couldn't sync calendar. Check your connection and try again.",
        }
      )
    }
  >
    Sync (fails)
  </Button>
</div>`,
      },
      {
        name: 'WithAction',
        description: 'An action button, e.g. undo after a destructive change, and a close button.',
        render: `<Button
  variant="outline"
  onClick={() =>
    toast('Conversation archived', {
      description: 'You can find it later in Archive.',
      closeButton: true,
      action: { label: 'Undo', onClick: () => toast.success('Conversation restored') },
    })
  }
>
  Archive conversation
</Button>`,
      },
    ],
  },
]
