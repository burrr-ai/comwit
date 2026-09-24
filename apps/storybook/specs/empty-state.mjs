export const specs = [
  {
    title: 'EmptyState',
    slug: 'empty-state',
    covers: ['empty-state'],
    imports: [
      { from: '@comwit/ui-templates/empty-state', names: ['EmptyState'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [`import { FolderOpen, Inbox, Plus, SearchX, Users } from 'lucide-react'`],
    stories: [
      {
        name: 'NoProjects',
        gallery: true,
        description: 'Icon, one-line title, a short hint and a single next step.',
        render: `<EmptyState
  className="w-full max-w-md py-8"
  icon={<FolderOpen />}
  title="No projects yet"
  description="Create a project to start tracking work with your team."
  action={
    <Button>
      <Plus /> New project
    </Button>
  }
/>`,
      },
      {
        name: 'NoResults',
        description: 'For an empty search or filter, offer a way back instead of a create action.',
        render: `<EmptyState
  className="w-full max-w-md"
  icon={<SearchX />}
  title="No results for “quarterly report”"
  description="Check the spelling or try a broader search. Filters may also be hiding results."
  action={<Button variant="outline">Clear filters</Button>}
/>`,
      },
      {
        name: 'TwoActions',
        description: 'action accepts more than one button; lead with the primary one.',
        render: `<EmptyState
  className="w-full max-w-md"
  icon={<Users />}
  title="Invite your team"
  description="Projects work better together. Teammates you invite can comment, assign and edit."
  action={
    <>
      <Button>Invite teammates</Button>
      <Button variant="ghost">Copy invite link</Button>
    </>
  }
/>`,
      },
      {
        name: 'Minimal',
        description:
          'No action — for small panels like a notification list where there is nothing to do yet.',
        render: `<EmptyState
  className="w-full max-w-xs py-10"
  icon={<Inbox />}
  title="You're all caught up"
  description="New notifications will show up here."
/>`,
      },
    ],
  },
]
