export const specs = [
  {
    title: 'Popup',
    slug: 'popup',
    // popup is a lib helper (lib/popup), not a ui component, so it covers no template file.
    covers: [],
    imports: [
      { from: '@comwit/ui-templates/lib/popup', names: ['popup'] },
      { from: '@comwit/ui-templates/button', names: ['Button'] },
    ],
    extraImports: [`import * as React from 'react'`, `import { Check } from 'lucide-react'`],
    stories: [
      {
        name: 'Confirm',
        gallery: true,
        description:
          'await popup.confirm(...) resolves true on confirm and false on cancel or dismiss.',
        renderFn: `const [result, setResult] = React.useState('')
return (
  <div className="flex flex-col items-center gap-3">
    <Button
      onClick={async () => {
        const ok = await popup.confirm({
          title: 'Publish changes?',
          description: 'Your edits will be visible to everyone with access to this page.',
          confirmText: 'Publish',
          cancelText: 'Keep editing',
        })
        setResult(ok ? 'Published' : 'Still a draft')
      }}
    >
      Publish page
    </Button>
    {result ? <p className="text-caption text-muted-foreground">{result}</p> : null}
  </div>
)`,
      },
      {
        name: 'DestructiveConfirm',
        description: 'destructive: true turns the confirm button red for irreversible actions.',
        renderFn: `const [projects, setProjects] = React.useState(['Marketing site', 'Mobile app', 'Design system'])
return (
  <div className="flex w-72 flex-col gap-2">
    {projects.map((name) => (
      <div key={name} className="flex items-center justify-between gap-3 rounded-card border border-border px-4 py-2">
        <span className="text-body-sm">{name}</span>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={async () => {
            const ok = await popup.confirm({
              title: 'Delete project?',
              description: name + ' and all of its deployments will be permanently deleted. This cannot be undone.',
              confirmText: 'Delete',
              destructive: true,
            })
            if (ok) setProjects((list) => list.filter((p) => p !== name))
          }}
        >
          Delete
        </Button>
      </div>
    ))}
    {projects.length === 0 ? (
      <p className="text-caption text-muted-foreground">No projects left.</p>
    ) : null}
  </div>
)`,
      },
      {
        name: 'Alert',
        description:
          'await popup.alert(...) shows a single-button notice and resolves when it closes.',
        renderFn: `const [acknowledged, setAcknowledged] = React.useState(false)
return (
  <div className="flex flex-col items-center gap-3">
    <Button
      variant="outline"
      onClick={async () => {
        await popup.alert({
          title: 'Session expired',
          description: 'For your security, you were signed out after 30 minutes of inactivity.',
          confirmText: 'Sign in again',
        })
        setAcknowledged(true)
      }}
    >
      Show session notice
    </Button>
    {acknowledged ? <p className="text-caption text-muted-foreground">Notice acknowledged</p> : null}
  </div>
)`,
      },
      {
        name: 'Sheet',
        description:
          'popup.sheet(render, options) opens a bottom sheet; resolve(value) closes it with a value, dismissing resolves undefined.',
        renderFn: `const plans = [
  { id: 'starter', name: 'Starter', price: '$0 / month' },
  { id: 'pro', name: 'Pro', price: '$12 / month' },
  { id: 'team', name: 'Team', price: '$30 / month' },
]
const [plan, setPlan] = React.useState('pro')
const current = plans.find((p) => p.id === plan)
return (
  <div className="flex flex-col items-center gap-3">
    <Button
      variant="outline"
      onClick={async () => {
        const picked = await popup.sheet<string>(
          ({ resolve, close }) => (
            <div className="grid gap-2">
              {plans.map((p) => (
                <Button
                  key={p.id}
                  variant={p.id === plan ? 'secondary' : 'ghost'}
                  className="justify-between"
                  onClick={() => resolve(p.id)}
                >
                  <span>{p.name}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {p.price}
                    {p.id === plan ? <Check /> : null}
                  </span>
                </Button>
              ))}
              <Button variant="outline" className="mt-2" onClick={close}>
                Cancel
              </Button>
            </div>
          ),
          { title: 'Choose a plan', description: 'You can switch plans at any time.' }
        )
        if (picked !== undefined) setPlan(picked)
      }}
    >
      Change plan
    </Button>
    <p className="text-caption text-muted-foreground">Current plan: {current?.name}</p>
  </div>
)`,
      },
    ],
  },
]
